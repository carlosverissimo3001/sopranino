import 'reflect-metadata';
import { Prisma } from '@prisma/client';
import { Transactional } from './transactional.decorator';
import { setBasePrismaClient, transactionStorage } from './transaction.store';

describe('@Transactional', () => {
  const opened: (Prisma.TransactionIsolationLevel | undefined)[] = [];
  const tx = { marker: 'tx' };

  beforeEach(() => {
    opened.length = 0;
    setBasePrismaClient({
      $transaction: jest.fn(
        async (
          fn: (client: unknown) => Promise<unknown>,
          options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
        ) => {
          opened.push(options?.isolationLevel);
          return fn(tx);
        },
      ),
    } as never);
  });

  class Svc {
    @Transactional()
    async outer(): Promise<unknown> {
      return this.inner();
    }

    @Transactional()
    async inner(): Promise<unknown> {
      return transactionStorage.getStore()?.tx;
    }

    @Transactional({
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
    async serializable(): Promise<unknown> {
      return this.inner();
    }

    @Transactional()
    async outerDefault(): Promise<unknown> {
      return this.strictInner();
    }

    @Transactional({
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
    async strictInner(): Promise<unknown> {
      return null;
    }
  }

  const svc = new Svc();

  it('opens one transaction, not one per decorated method', async () => {
    await svc.outer();

    expect(opened).toHaveLength(1);
  });

  // A second transaction would sit on its own connection, out of reach of the
  // outer rollback and able to deadlock against a lock the outer holds.
  it('gives a nested method the caller`s transaction', async () => {
    await expect(svc.outer()).resolves.toBe(tx);
  });

  it('passes the isolation level to the database', async () => {
    await svc.serializable();

    expect(opened).toEqual([Prisma.TransactionIsolationLevel.Serializable]);
  });

  // Postgres cannot change level mid-transaction, so the alternative to
  // throwing is running at the weaker one and saying nothing.
  it('refuses an inner method that asks for a different level', async () => {
    await expect(svc.outerDefault()).rejects.toThrow(/Isolation cannot change/);
  });
});
