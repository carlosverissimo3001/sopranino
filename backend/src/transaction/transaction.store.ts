import { AsyncLocalStorage } from 'async_hooks';
import type { Prisma, PrismaClient } from '@prisma/client';

export interface TransactionStore {
  /** Current Prisma transaction client when inside a transactional boundary */
  tx: Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  >;

  /** What the outermost boundary opened at, so an inner one cannot contradict it. */
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

export const transactionStorage = new AsyncLocalStorage<TransactionStore>();

/** Base Prisma client (set at app bootstrap by TransactionModule). Used by decorator and proxy. */
let basePrismaClient: PrismaClient | null = null;

export function setBasePrismaClient(client: PrismaClient): void {
  basePrismaClient = client;
}

export function getBasePrismaClient(): PrismaClient {
  if (!basePrismaClient) {
    throw new Error(
      'Base Prisma client not set. Ensure TransactionModule is loaded and PrismaModule is imported before it.',
    );
  }
  return basePrismaClient;
}

/**
 * Returns the current transaction client from ALS if inside a @Transactional() boundary,
 * otherwise returns the fallback (base) client. Used by the Prisma proxy so all model
 * access and raw queries use the active transaction when present.
 */
export function getTxClient(fallback: PrismaClient): PrismaClient {
  const store = transactionStorage.getStore();
  if (store?.tx) {
    return store.tx as PrismaClient;
  }
  return fallback;
}
