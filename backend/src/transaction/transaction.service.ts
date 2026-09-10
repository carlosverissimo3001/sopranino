import { Injectable, Inject } from '@nestjs/common';
import { transactionStorage } from './transaction.store';
import { PRISMA_CLIENT_INTERNAL } from '@prisma/prisma.constants';
import type { PrismaClient } from '@prisma/client';

@Injectable()
export class TransactionService {
  constructor(
    @Inject(PRISMA_CLIENT_INTERNAL)
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * Returns the current Prisma client: the transaction client when inside a
   * @Transactional() boundary, otherwise the main client.
   */
  getClient(): PrismaClient {
    const store = transactionStorage.getStore();
    if (store?.tx) {
      return store.tx as PrismaClient;
    }
    return this.prisma;
  }

  /**
   * Runs the given callback inside a Prisma transaction. The transaction client
   * is stored in AsyncLocalStorage so any code that uses the transaction-aware
   * PrismaService (proxy) will automatically participate.
   * If the callback throws, the transaction is rolled back.
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    // Joins the caller's transaction rather than opening a second one on its
    // own connection, which an outer rollback could not reach.
    if (transactionStorage.getStore()?.tx) {
      return fn();
    }

    return this.prisma.$transaction(async (tx) => {
      return transactionStorage.run({ tx }, () => fn());
    });
  }
}
