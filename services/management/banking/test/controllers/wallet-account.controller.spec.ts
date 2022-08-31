import { describe, it } from '@tcom/test';
import { mock, when, instance, verify, reset, deepEqual } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { WalletAccount, UserWalletAccounts, WalletAccountManager, WalletAccountFilter, WalletManager, WalletType, WalletFlow, UserWallet } from '@tcom/platform/lib/banking';
import { WalletAccountController } from '../../src/controllers/wallet-account.controller';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';

const walletAccounts: WalletAccount[] = [{
    id: 19,
    name: 'Diamonds',
    walletId: 7,
    allowNegative: false,
    balance: 5734,
    balanceRaw: 5734,
    balanceUpdateTime: new Date(),
    baseBalance: 573.4,
    currencyCode: 'DIA',
    createTime: new Date()
}];

describe('WalletAccountController', () => {
    const mockWalletManager = mock(WalletManager);
    const mockWalletAccuontManager = mock(WalletAccountManager);

    function getController(): WalletAccountController {
        return new WalletAccountController(instance(mockWalletManager), instance(mockWalletAccuontManager));
    }

    const walletId = 7;
    const page = 1;
    const pageSize = 20;
    const userId = 1;
    const accountId = 19;

    beforeEach(() => {
        reset(mockWalletManager);
        reset(mockWalletAccuontManager);
    });

    describe('getAll()', () => {
        it('should return all wallet accounts', async () => {
            const currencyCode = 'DIA';
            const name = UserWalletAccounts.Diamonds;

            const walletFilter: WalletAccountFilter = {
                walletId,
                currencyCode,
                name,
                page,
                pageSize
            };

            when(mockWalletAccuontManager.getAll(deepEqual(walletFilter))).thenResolve(new PagedResult(walletAccounts, 10, page, pageSize));

            const controller = getController();

            // When
            const result = await controller.getAll(walletId, name, currencyCode);

            // Then
            expect(result.items[0]).to.equal(walletAccounts[0]);
            verify(mockWalletAccuontManager.getAll(deepEqual(walletFilter))).once();
        });
    });

    describe('getForUser()', () => {
        const walletForUser: UserWallet = {
            id: walletId,
            type: WalletType.User,
            flow: WalletFlow.All,
            createTime: new Date(),
            userId,
        };

        const walletFilter: WalletAccountFilter = {
            walletId,
            page,
            pageSize
        };

        it('should return all wallet accounts for a user', async () => {
            // Given
            when(mockWalletManager.getForUser(userId)).thenResolve(walletForUser);
            when(mockWalletAccuontManager.getAll(deepEqual(walletFilter))).thenResolve(new PagedResult(walletAccounts, 10, page, pageSize));

            const controller = getController();

            // When
            const result = await controller.getForUser(userId);

            // Then
            expect(result.items[0].name).to.equal('Diamonds');
            verify(mockWalletManager.getForUser(userId)).once();
            verify(mockWalletAccuontManager.getAll(deepEqual(walletFilter))).once();
        });

        it('should throw a not found error if no wallet is returned', async () => {
            // Given
            when(mockWalletManager.getForUser(userId)).thenResolve();

            const controller = getController();

            // When
            const delegate = async () => controller.getForUser(1, page, pageSize);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Wallet not found');
        });
    });

    describe('getById()', () => {
        it('should return a wallet account by ID', async () => {
            // Given
            when(mockWalletAccuontManager.get(accountId)).thenResolve(walletAccounts[0]);

            const controller = getController();

            // When
            const result = await controller.getById(accountId);

            // Then
            expect(result).to.equal(walletAccounts[0]);
            verify(mockWalletAccuontManager.get(accountId)).once();
        });

        it('should throw a not found error if no wallet by ID is returned', async () => {
            // Given
            when(mockWalletAccuontManager.get(accountId)).thenResolve();

            const controller = getController();

            // When
            const delegate = async () => controller.getById(accountId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Account not found.');
        });
    });
});