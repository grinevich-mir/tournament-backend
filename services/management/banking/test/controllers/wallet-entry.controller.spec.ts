import { describe, it } from '@tcom/test';
import { mock, instance, verify, reset, when, deepEqual } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { RequesterType, TransactionPurpose, UserWallet, WalletEntry, WalletEntryFilter, WalletEntryManager, WalletFlow, WalletManager, WalletType } from '@tcom/platform/lib/banking';
import { WalletEntryController } from '../../src/controllers/wallet-entry.controller';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';

const walletEntries: WalletEntry[] = [{
    id: 1,
    purpose: TransactionPurpose.Subscription,
    requesterId: 'Chargify',
    requesterType: RequesterType.System,
    createTime: new Date(),
}];

describe('WalletEntryController', () => {
    const mockWalletManager = mock(WalletManager);
    const mockEntryManager = mock(WalletEntryManager);

    function getController(): WalletEntryController {
        return new WalletEntryController(instance(mockWalletManager), instance(mockEntryManager));
    }

    const walletId = 7;
    const accountId = 1;
    const purpose = TransactionPurpose.Subscription;
    const from = new Date();
    const to = new Date();
    const page = 1;
    const pageSize = 20;
    const userId = 1;

    beforeEach(() => {
        reset(mockWalletManager);
        reset(mockEntryManager);
    });

    describe('getAll()', () => {
        it('should return all wallet entries', async () => {
            // Given
            const walletFilter: WalletEntryFilter = {
                walletId,
                accountId,
                purpose,
                from,
                to,
                page,
                pageSize
            };

            when(mockEntryManager.getAll(deepEqual(walletFilter))).thenResolve(new PagedResult(walletEntries, 1, page, pageSize));

            const controller = getController();

            // When
            const result = await controller.getAll(accountId, walletId, purpose, from, to);

            // Then
            expect(result.items).to.equal(walletEntries);
            verify(mockEntryManager.getAll(deepEqual(walletFilter))).once();
        });
    });

    describe('getForUser()', async () => {
        const userWallet: UserWallet = {
            id: walletId,
            type: WalletType.User,
            flow: WalletFlow.All,
            createTime: new Date(),
            userId,
        };

        const walletFilter: WalletEntryFilter = {
            walletId,
            accountId,
            purpose,
            from,
            to,
            page,
            pageSize
        };

        it('should return all wallet entries for a user', async () => {
            // Given
            when(mockWalletManager.getForUser(userId)).thenResolve(userWallet);
            when(mockEntryManager.getAll(deepEqual(walletFilter))).thenResolve(new PagedResult(walletEntries, 10, page, pageSize));

            const controller = getController();

            // When
            const result = await controller.getForUser(userId, accountId, purpose, from, to, page, pageSize);

            // Then
            expect(result.items[0].id).to.equal(1);
            verify(mockWalletManager.getForUser(userId)).once();
            verify(mockEntryManager.getAll(deepEqual(walletFilter))).once();
        });

        it('should throw a not found error if no wallet entry is returned', async () => {
            // Given
            when(mockWalletManager.getForUser(userId)).thenResolve();

            const controller = getController();

            // When
            const delegate = async () => controller.getForUser(1);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Wallet not found.');
        });

    });

    describe('getById()', () => {
        const walletEntriesById: WalletEntry = {
            id: 1,
            purpose: TransactionPurpose.Subscription,
            requesterId: 'Chargify',
            requesterType: RequesterType.System,
            createTime: new Date(),
            transactions: [{
                id: 1,
                entryId: 1,
                accountId: 13,
                walletId: 5,
                amount: -29.99,
                amountRaw: -29.99,
                baseAmount: -29.99,
                currencyCode: 'USD',
                exchangeRate: 1,
                purpose,
                requesterId: 'Chargify',
                requesterType: RequesterType.System,
                createTime: new Date()
            }]
        };

        it('should return a wallet entry by ID', async () => {
            // Given
            when(mockEntryManager.get(1)).thenResolve(walletEntriesById);

            const controller = getController();

            // When
            const result = await controller.getById(1);

            // Then
            expect(result.purpose).to.equal('Subscription');
            expect(result.id).to.equal(1);
            verify(mockEntryManager.get(1)).once();
        });

        it('should throw a not found error if no wallet entry by ID is returned', async () => {
            // Given
            when(mockEntryManager.get(1)).thenResolve();

            const controller = getController();

            // When
            const delegate = async () => controller.getById(1);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Entry not found.');
        });
    });

});