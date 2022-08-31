import { describe, it } from '@tcom/test';
import { mock, instance, verify, reset, when, deepEqual } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { RequesterType, TransactionPurpose, UserWallet, WalletFlow, WalletManager, WalletTransaction, WalletTransactionFilter, WalletTransactionManager, WalletType } from '@tcom/platform/lib/banking';
import { WalletTransactionController } from '../../src/controllers/wallet-transaction.controller';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';

const transactions: WalletTransaction[] = [{
  id: 6,
  entryId: 2,
  accountId: 20,
  walletId: 7,
  amount: 300,
  amountRaw: 300,
  baseAmount: 300,
  currencyCode: 'USD',
  exchangeRate: 1,
  purpose: TransactionPurpose.PayOut,
  requesterId: 'Leaderboard:12',
  requesterType: RequesterType.System,
  createTime: new Date(),
}];

describe('WalletTransactionController', () => {
  const mockWalletManager = mock(WalletManager);
  const mockWalletTransactionManager = mock(WalletTransactionManager);

  function getController(): WalletTransactionController {
    return new WalletTransactionController(instance(mockWalletManager), instance(mockWalletTransactionManager));
  }

  const accountId = 1;
  const walletId = 7;
  const currencyCode = 'USD';
  const purpose = TransactionPurpose.PayOut;
  const from = new Date();
  const to = new Date();
  const page = 1;
  const pageSize = 20;
  const userId = 1;
  const transactionId = 6;

  beforeEach(() => {
    reset(mockWalletManager);
    reset(mockWalletTransactionManager);
  });

  describe('getAll()', () => {
    const filter: WalletTransactionFilter = {
      accountId,
      walletId,
      currencyCode,
      purpose,
      from,
      to,
      page,
      pageSize,
    };

    it('should return all wallet transactions', async () => {
      // Given
      when(mockWalletTransactionManager.getAll(deepEqual(filter))).thenResolve(new PagedResult(transactions, 10, page, pageSize));

      const controller = getController();

      // When
      const result = await controller.getAll(accountId, walletId, currencyCode, purpose, from, to);

      // Then
      expect(result.items[0].currencyCode).to.equal('USD');
      verify(mockWalletTransactionManager.getAll(deepEqual(filter))).once();
    });
  });

  describe('getForUser()', () => {
    const userWalletModel: UserWallet = {
      id: walletId,
      type: WalletType.User,
      flow: WalletFlow.All,
      createTime: new Date(),
      userId,
    };

    const filter: WalletTransactionFilter = {
      walletId,
      currencyCode,
      purpose,
      from,
      to,
      page,
      pageSize
    };

    it('should return all wallet transactions for a user', async () => {
      // Given
      when(mockWalletManager.getForUser(userId)).thenResolve(userWalletModel);
      when(mockWalletTransactionManager.getAll(deepEqual(filter))).thenResolve(new PagedResult(transactions, 10, page, pageSize));

      const controller = getController();

      // When
      const result = await controller.getForUser(userId, currencyCode, purpose, from, to);

      // Then
      expect(result.items[0].purpose).to.equal('PayOut');
      verify(mockWalletManager.getForUser(userId)).once();
      verify(mockWalletTransactionManager.getAll(deepEqual(filter))).once();
    });

    it('should throw a not found error if no wallet transaction is returned', async () => {
      // Given
      when(mockWalletManager.getForUser(userId)).thenResolve();

      const controller = getController();

      // When
      const delegate = async () => controller.getForUser(userId);

      // Then
      await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Wallet not found.');
    });
  });

  describe('getById()', () => {
    it('should return a wallet transaction by ID', async () => {
      // Given
      when(mockWalletTransactionManager.get(transactionId)).thenResolve(transactions[0]);

      const controller = getController();

      // When
      const result = await controller.getById(transactionId);

      // Then
      expect(result.purpose).to.equal('PayOut');
      verify(mockWalletTransactionManager.get(transactionId)).once();
    });

    it('should throw a not found error if no wallet transaction by ID is returned', async () => {
      // Given
      when(mockWalletTransactionManager.get(transactionId)).thenResolve();

      const controller = getController();

      // When
      const delegate = async () => controller.getById(transactionId);

      // Then
      await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Transaction not found.');
    });
  });
});