import { describe, it } from '@tcom/test';
import { mock, when, instance, reset, mockUserRequest, mockUser } from '@tcom/test/mock';
import { WalletAccountManager, UserWalletAccounts, WalletAccount } from '@tcom/platform/lib/banking';
import { WalletController } from '../../src/controllers/wallet.controller';
import { expect } from '@tcom/test/assert';
import { User, UserType } from '@tcom/platform/lib/user';

describe('WalletController', () => {
    const userId = 1;
    const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
    const skinId = 'tournament';
    const userType = UserType.Standard;
    const mockManager = mock(WalletAccountManager);

    function getController(): WalletController {
        return new WalletController(instance(mockManager));
    }

    beforeEach(() => {
        reset(mockManager);
    });

    describe('get()', () => {
        const visibleAccounts = [
            UserWalletAccounts.Withdrawable,
            UserWalletAccounts.Diamonds
        ];

        it('should return the default wallet response when user does not have any wallet accounts', async () => {
            // Given
            const accounts: WalletAccount[] = [];

            when(mockManager.getManyForUser(userId, ...visibleAccounts)).thenResolve(accounts);

            const controller = getController();

            const request = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(request));

            // When
            const result = await controller.get();

            // Then
            expect(result).to.exist;
            expect(result.withdrawable).to.exist;
            expect(result.withdrawable.balance).to.equal(0);
            expect(result.withdrawable.currencyCode).to.equal('USD');
            expect(result.diamonds).to.equal(0);
        });

        it('should return wallet response with default withdrawable when user only has diamonds wallet account', async () => {
            // Given
            const balance = 12;
            const accounts: WalletAccount[] = [
                {
                    id: 1,
                    name: UserWalletAccounts.Diamonds,
                    walletId: 1,
                    balance,
                    balanceRaw: 0,
                    baseBalance: 0,
                    currencyCode: 'DIA',
                    allowNegative: false,
                    balanceUpdateTime: new Date(),
                    createTime: new Date(),
                }
            ];

            when(mockManager.getManyForUser(userId, ...visibleAccounts)).thenResolve(accounts);

            const controller = getController();

            const request = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(request));

            // When
            const result = await controller.get();

            // Then
            expect(result).to.exist;
            expect(result.withdrawable).to.exist;
            expect(result.withdrawable.balance).to.equal(0);
            expect(result.withdrawable.currencyCode).to.equal('USD');
            expect(result.diamonds).to.equal(balance);
        });

        it('should return wallet response with default diamonds when user only has withdrawable wallet account', async () => {
            // Given
            const balance = 42.23;
            const accounts: WalletAccount[] = [
                {
                    id: 1,
                    name: UserWalletAccounts.Withdrawable,
                    walletId: 1,
                    balance,
                    balanceRaw: 0,
                    baseBalance: 0,
                    currencyCode: 'CAD',
                    allowNegative: false,
                    balanceUpdateTime: new Date(),
                    createTime: new Date(),
                }
            ];

            when(mockManager.getManyForUser(userId, ...visibleAccounts)).thenResolve(accounts);

            const controller = getController();

            const request = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(request));

            // When
            const result = await controller.get();

            // Then
            expect(result).to.exist;
            expect(result.withdrawable).to.exist;
            expect(result.withdrawable.balance).to.equal(balance);
            expect(result.withdrawable.currencyCode).to.equal('CAD');
            expect(result.diamonds).to.equal(0);
        });

        it('should return wallet response', async () => {
            // Given
            const withdrawableBalance = 42.23;
            const diamondsBalance = 543;
            const accounts: WalletAccount[] = [
                {
                    id: 1,
                    name: UserWalletAccounts.Withdrawable,
                    walletId: 1,
                    balance: withdrawableBalance,
                    balanceRaw: 0,
                    baseBalance: 0,
                    currencyCode: 'CAD',
                    allowNegative: false,
                    balanceUpdateTime: new Date(),
                    createTime: new Date(),
                },
                {
                    id: 2,
                    name: UserWalletAccounts.Diamonds,
                    walletId: 1,
                    balance: diamondsBalance,
                    balanceRaw: 0,
                    baseBalance: 0,
                    currencyCode: 'DIA',
                    allowNegative: false,
                    balanceUpdateTime: new Date(),
                    createTime: new Date(),
                }
            ];

            when(mockManager.getManyForUser(userId, ...visibleAccounts)).thenResolve(accounts);

            const controller = getController();

            const request = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(request));

            // When
            const result = await controller.get();

            // Then
            expect(result).to.exist;
            expect(result.withdrawable).to.exist;
            expect(result.withdrawable.balance).to.equal(withdrawableBalance);
            expect(result.withdrawable.currencyCode).to.equal('CAD');
            expect(result.diamonds).to.equal(diamondsBalance);
        });
    });
});