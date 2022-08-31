import { describe, it } from '@tcom/test';
import { mock, instance, verify, reset, when, deepEqual } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { WalletController } from '../../src/controllers/wallet.controller';
import { PlatformWallets, Wallet, WalletFilter, WalletFlow, WalletManager, WalletType } from '@tcom/platform/lib/banking';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';

describe('WalletController', () => {
    const mockWalletManager = mock(WalletManager);

    function getController(): WalletController {
        return new WalletController(instance(mockWalletManager));
    }

    beforeEach(() => reset(mockWalletManager));

    describe('getAll()', () => {
        const type = WalletType.Platform || WalletType.User;
        const name = PlatformWallets.Corporate;
        const flow = WalletFlow.All;
        const userId = 1;
        const page = 1;
        const pageSize = 20;

        const wallets: Wallet[] = [{
            type: WalletType.Platform,
            id: 1,
            name,
            flow,
            createTime: new Date(),
        },
        {
            type: WalletType.User,
            id: 8,
            userId: 2,
            flow,
            createTime: new Date(),
        }];

        const filter: WalletFilter = {
            type,
            name,
            flow,
            userId,
            page,
            pageSize,
        };

        it('should return all wallets', async () => {
            // Given
            when(mockWalletManager.getAll(deepEqual(filter))).thenResolve(new PagedResult(wallets, 1, page, pageSize));

            const controller = getController();

            // When
            const result = await controller.getAll(type, name, flow, userId);

            // Then
            expect(result.items[0].type).to.equal('Platform');
            expect(result.items[1].type).to.equal('User');
            expect(result.items[1].flow).to.equal('All');
            verify(mockWalletManager.getAll(deepEqual(filter))).once();
        });
    });

    describe('getAllPlatform()', () => {
        const type = WalletType.Platform;
        const name = PlatformWallets.Corporate;
        const flow = WalletFlow.All;
        const page = 1;
        const pageSize = 20;

        const walletsPlatform: Wallet[] = [{
            type,
            id: 1,
            name,
            flow,
            createTime: new Date(),
        }];

        const filter: WalletFilter = {
            type,
            name,
            flow,
            page,
            pageSize
        };

        it('should return all platform wallets', async () => {
            // Given
            when(mockWalletManager.getAll(deepEqual(filter))).thenResolve(new PagedResult(walletsPlatform, 1, page, pageSize));

            const controller = getController();

            // When
            const result = await controller.getAllPlatform(name, flow);

            // Then
            expect(result.items[0]).to.equal(walletsPlatform[0]);
            verify(mockWalletManager.getAll(deepEqual(filter))).once();
        });
    });

    describe('getForPlatform()', () => {
        const walletsForPlatform: Wallet = {
            type: WalletType.Platform,
            id: 5,
            name: PlatformWallets.Chargify,
            flow: WalletFlow.All,
            createTime: new Date(),
        };

        it('should return a platform wallet', async () => {
            // Given
            when(mockWalletManager.getForPlatform(PlatformWallets.Chargify)).thenResolve(walletsForPlatform);

            const controller = getController();

            // When
            const result = await controller.getForPlatform(PlatformWallets.Chargify);

            // Then
            expect(result.name).to.equal('Chargify');
            verify(mockWalletManager.getForPlatform(PlatformWallets.Chargify)).once();
        });

        it('should throw a not found erro if no platform wallet is returned', async () => {
            // Given
            when(mockWalletManager.getForPlatform(PlatformWallets.Chargify)).thenResolve();

            const controller = getController();

            // When
            const delegate = async () => controller.getForPlatform(PlatformWallets.Chargify);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Wallet not found.');
        });
    });

    describe('getAllUser()', () => {
        const type = WalletType.User;
        const flow = WalletFlow.All;
        const page = 1;
        const pageSize = 20;
        const userId = 1;

        const userWallet: Wallet[] = [{
            type,
            id: 7,
            userId: 1,
            flow,
            createTime: new Date(),
        }];

        const filter: WalletFilter = {
            type,
            userId,
            page,
            pageSize
        };

        it('should return all user wallets', async () => {
            // Given
            when(mockWalletManager.getAll(deepEqual(filter))).thenResolve(new PagedResult(userWallet, 1, page, pageSize));

            const controller = getController();

            // When
            const result = await controller.getAllUser(userId);

            // Then
            expect(result.items[0]).to.equal(userWallet[0]);
            verify(mockWalletManager.getAll(deepEqual(filter))).once();
        });
    });

    describe('getForUser()', () => {
        const userWallet: Wallet = {
            type: WalletType.User,
            id: 7,
            userId: 1,
            flow: WalletFlow.All,
            createTime: new Date(),
        };

        it('should return a user wallet', async () => {
            // Given
            when(mockWalletManager.getForUser(1)).thenResolve(userWallet);

            const controller = getController();

            // When
            const result = await controller.getForUser(1);

            // Then
            expect(result).to.equal(userWallet);
            verify(mockWalletManager.getForUser(1)).once();
        });

        it('should throw an error if no user wallet is returned', async () => {
            // Given
            when(mockWalletManager.getForUser(1)).thenResolve();

            const controller = getController();

            // Whem
            const delegate = async () => controller.getForUser(1);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Wallet not found.');
        });
    });

    describe('get()', () => {
        const userWallet: Wallet = {
            type: WalletType.Platform,
            id: 1,
            name: PlatformWallets.Corporate,
            flow: WalletFlow.All,
            createTime: new Date(),
        };

        it('should return a wallet by ID', async () => {
            // Given
            when(mockWalletManager.get(1)).thenResolve(userWallet);

            const controller = getController();

            // When
            const result = await controller.get(1);

            // Then
            expect(result).to.equal(userWallet);
            verify(mockWalletManager.get(1)).once();
        });

        it('should throw a not found error if no wallet by ID is returned', async () => {
            // Given
            when(mockWalletManager.get(1)).thenResolve();

            const controller = getController();

            // When
            const delegate = async () => controller.get(1);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Wallet not found.');
        });
    });
});