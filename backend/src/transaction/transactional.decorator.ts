import { Prisma } from '@prisma/client';
import { transactionStorage, getBasePrismaClient } from './transaction.store';

const TRANSACTIONAL_KEY = Symbol('transactional');

const DEFAULT_TIMEOUT_MS = 30000;

export interface TransactionalOptions {
  isolationLevel?: Prisma.TransactionIsolationLevel;
  timeout?: number;
}

/**
 * Runs the method inside a Prisma transaction. Anything it calls that reaches
 * for PrismaService joins the same one, decorated or not, because the injected
 * client is a proxy that reads the transaction out of AsyncLocalStorage.
 *
 * A decorated method called from inside another one joins rather than opening
 * a second transaction. Opening a second would put the inner writes on their
 * own connection, where an outer rollback cannot reach them and an outer lock
 * can deadlock against them.
 *
 * Isolation belongs to the outermost boundary, since Postgres cannot change
 * level once a transaction has started. An inner method asking for a different
 * one throws rather than quietly running at the weaker of the two.
 */
export function Transactional(
  options: TransactionalOptions = {},
): MethodDecorator {
  return function (
    _target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (
      ...args: unknown[]
    ) => Promise<unknown>;
    if (typeof originalMethod !== 'function') {
      throw new Error(
        `@Transactional() can only be applied to methods. Invalid target: ${String(propertyKey)}`,
      );
    }

    descriptor.value = async function (this: unknown, ...args: unknown[]) {
      const ambient = transactionStorage.getStore();

      if (ambient?.tx) {
        if (
          options.isolationLevel &&
          options.isolationLevel !== ambient.isolationLevel
        ) {
          throw new Error(
            `${String(propertyKey)} asks for ${options.isolationLevel} inside a transaction already running at ${ambient.isolationLevel ?? 'the database default'}. Isolation cannot change once a transaction has started: set it on the outermost boundary.`,
          );
        }
        return originalMethod.apply(this, args);
      }

      const prisma = getBasePrismaClient();
      return prisma.$transaction(
        async (tx) =>
          transactionStorage.run(
            { tx, isolationLevel: options.isolationLevel },
            () => originalMethod.apply(this, args),
          ),
        {
          timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
          ...(options.isolationLevel
            ? { isolationLevel: options.isolationLevel }
            : {}),
        },
      );
    };

    Reflect.defineMetadata(TRANSACTIONAL_KEY, true, descriptor.value);
    return descriptor;
  };
}
