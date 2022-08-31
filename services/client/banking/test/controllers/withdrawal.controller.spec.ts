import { describe, it } from '@tcom/test';
import { mock, when, instance, deepEqual, anything, verify, mockUserRequest, reset, mockUser } from '@tcom/test/mock';
import { WalletAccountManager, WithdrawalManager, WithdrawalRequestFilter, WithdrawalRequest, RequesterType, WithdrawalRequestStatus, UserWalletAccounts, WalletAccount, WithdrawalProvider, NewWithdrawalRequest } from '@tcom/platform/lib/banking';
import { WithdrawalController } from '../../src/controllers/withdrawal.controller';
import { expect } from '@tcom/test/assert';
import { NotFoundError, BadRequestError, PagedResult, ForbiddenError } from '@tcom/platform/lib/core';
import { User, UserAddressStatus, UserVerificationStatus, UserType } from '@tcom/platform/lib/user';
import { UpgradeConfigManager, UpgradeLevelConfig } from '@tcom/platform/lib/upgrade';
import { NewWithdrawalRequestModel } from '../../src/models';

describe('WithdrawalController', () => {
    const mockAccountManager = mock(WalletAccountManager);
    const mockWithdrawalManager = mock(WithdrawalManager);
    const mockUpgradeConfigManger = mock(UpgradeConfigManager);

    function getController(): WithdrawalController {
        return new WithdrawalController(
            instance(mockAccountManager),
            instance(mockWithdrawalManager),
            instance(mockUpgradeConfigManger));
    }

    beforeEach(() => {
        reset(mockAccountManager);
        reset(mockWithdrawalManager);
        reset(mockUpgradeConfigManger);
    });

    describe('getAll()', () => {
        it('should return requests with 100 minimum amount when user has no currency', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const userLevel = 1;
            const page = 1;
            const pageSize = 20;
            const filter: WithdrawalRequestFilter = {
                page,
                pageSize,
                userId
            };
            const requests: WithdrawalRequest[] = [
                {
                    id: 'b3a535a3-62de-4fee-8e2d-7bf3195b4e07',
                    provider: WithdrawalProvider.PayPal,
                    amount: 200,
                    currencyCode: 'USD',
                    requesterId: userId.toString(),
                    requesterType: RequesterType.User,
                    status: WithdrawalRequestStatus.Pending,
                    targetCompletionTime: new Date(),
                    userId,
                    walletEntryId: 1,
                    createTime: new Date(),
                    updateTime: new Date()
                }
            ];

            when(mockWithdrawalManager.getAll(deepEqual(filter))).thenResolve(new PagedResult(requests, 1, page, pageSize));

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType,
                    level: userLevel,
                    currencyCode: undefined
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getAll();

            // Then
            expect(result).to.exist;
            expect(result.minAmount).to.equal(100);
            expect(result.items).to.be.lengthOf(1);
            expect(result.items[0]).to.deep.equals({
                id: requests[0].id,
                provider: requests[0].provider,
                providerRef: requests[0].providerRef,
                amount: requests[0].amount,
                currencyCode: requests[0].currencyCode,
                status: requests[0].status,
                targetCompletionTime: requests[0].targetCompletionTime,
                completionTime: requests[0].completionTime,
                createTime: requests[0].createTime,
                updateTime: requests[0].updateTime
            });
        });

        it('should return requests with 100 minimum amount when level config exists without currency', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const userCurrency = 'USD';
            const userLevel = 1;
            const page = 1;
            const pageSize = 20;
            const filter: WithdrawalRequestFilter = {
                page,
                pageSize,
                userId
            };
            const requests: WithdrawalRequest[] = [
                {
                    id: 'b3a535a3-62de-4fee-8e2d-7bf3195b4e07',
                    provider: WithdrawalProvider.PayPal,
                    amount: 200,
                    currencyCode: userCurrency,
                    requesterId: userId.toString(),
                    requesterType: RequesterType.User,
                    status: WithdrawalRequestStatus.Pending,
                    targetCompletionTime: new Date(),
                    userId,
                    walletEntryId: 1,
                    createTime: new Date(),
                    updateTime: new Date()
                }
            ];

            const levelConfig: UpgradeLevelConfig = {
                level: userLevel,
                skinId: 'tournament',
                tournamentMaxActiveEntries: 1,
                withdrawalMinAmounts: {},
                withdrawalTargetDays: 7,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockWithdrawalManager.getAll(deepEqual(filter))).thenResolve(new PagedResult(requests, 1, page, pageSize));
            when(mockUpgradeConfigManger.getForLevel(skinId, userLevel)).thenResolve(levelConfig);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType,
                    level: userLevel,
                    currencyCode: userCurrency
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getAll();

            // Then
            expect(result).to.exist;
            expect(result.minAmount).to.equal(100);
            expect(result.items).to.be.lengthOf(1);
            expect(result.items[0]).to.deep.equals({
                id: requests[0].id,
                provider: requests[0].provider,
                providerRef: requests[0].providerRef,
                amount: requests[0].amount,
                currencyCode: requests[0].currencyCode,
                status: requests[0].status,
                targetCompletionTime: requests[0].targetCompletionTime,
                completionTime: requests[0].completionTime,
                createTime: requests[0].createTime,
                updateTime: requests[0].updateTime
            });
        });

        it('should return requests with 75 minimum amount when level config exists with currency', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const userCurrency = 'USD';
            const userLevel = 1;
            const page = 1;
            const pageSize = 20;
            const filter: WithdrawalRequestFilter = {
                page,
                pageSize,
                userId
            };
            const requests: WithdrawalRequest[] = [
                {
                    id: 'b3a535a3-62de-4fee-8e2d-7bf3195b4e07',
                    provider: WithdrawalProvider.PayPal,
                    amount: 200,
                    currencyCode: userCurrency,
                    requesterId: userId.toString(),
                    requesterType: RequesterType.User,
                    status: WithdrawalRequestStatus.Pending,
                    targetCompletionTime: new Date(),
                    userId,
                    walletEntryId: 1,
                    createTime: new Date(),
                    updateTime: new Date()
                }
            ];

            const levelConfig: UpgradeLevelConfig = {
                level: userLevel,
                skinId: 'tournament',
                tournamentMaxActiveEntries: 1,
                withdrawalMinAmounts: {
                    USD: 75
                },
                withdrawalTargetDays: 7,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockWithdrawalManager.getAll(deepEqual(filter))).thenResolve(new PagedResult(requests, 1, page, pageSize));
            when(mockUpgradeConfigManger.getForLevel(skinId, userLevel)).thenResolve(levelConfig);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType,
                    level: userLevel,
                    currencyCode: userCurrency
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getAll();

            // Then
            expect(result).to.exist;
            expect(result.items).to.be.lengthOf(1);
            expect(result.items[0]).to.deep.equals({
                id: requests[0].id,
                provider: requests[0].provider,
                providerRef: requests[0].providerRef,
                amount: requests[0].amount,
                currencyCode: requests[0].currencyCode,
                status: requests[0].status,
                targetCompletionTime: requests[0].targetCompletionTime,
                completionTime: requests[0].completionTime,
                createTime: requests[0].createTime,
                updateTime: requests[0].updateTime
            });
        });

        it('should limit page size and return requests', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const page = 1;
            const pageSize = 40;
            const actualPageSize = 20;
            const filter: WithdrawalRequestFilter = {
                page,
                pageSize: actualPageSize,
                userId
            };
            const requests: WithdrawalRequest[] = [
                {
                    id: 'b3a535a3-62de-4fee-8e2d-7bf3195b4e07',
                    provider: WithdrawalProvider.PayPal,
                    amount: 200,
                    currencyCode: 'USD',
                    requesterId: userId.toString(),
                    requesterType: RequesterType.User,
                    status: WithdrawalRequestStatus.Pending,
                    targetCompletionTime: new Date(),
                    userId,
                    walletEntryId: 1,
                    createTime: new Date(),
                    updateTime: new Date()
                }
            ];

            when(mockWithdrawalManager.getAll(deepEqual(filter))).thenResolve(new PagedResult(requests, 1, page, actualPageSize));

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getAll(page, pageSize);

            // Then
            expect(result).to.exist;
            expect(result.items).to.be.lengthOf(1);
            expect(result.items[0]).to.deep.equals({
                id: requests[0].id,
                provider: requests[0].provider,
                providerRef: requests[0].providerRef,
                amount: requests[0].amount,
                currencyCode: requests[0].currencyCode,
                status: requests[0].status,
                targetCompletionTime: requests[0].targetCompletionTime,
                completionTime: requests[0].completionTime,
                createTime: requests[0].createTime,
                updateTime: requests[0].updateTime
            });
        });
    });

    describe('add()', () => {
        it('should throw cannot withdraw error when user is internal type', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Internal;
            const providerRef = 'abc123';
            const request: NewWithdrawalRequestModel = {
                providerRef
            };

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    addressStatus: UserAddressStatus.Pending,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.add(request);

            // Then
            await expect(delegate()).to.be.rejectedWith(ForbiddenError, 'Internal accounts cannot withdraw');
        });

        it('should throw a address status error when user address is missing', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const providerRef = 'abc123';

            const request: NewWithdrawalRequestModel = {
                providerRef
            };

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    addressStatus: UserAddressStatus.Pending,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.add(request);

            // Then
            await expect(delegate()).to.be.rejectedWith(BadRequestError, 'User must have an address');
        });

        it('should throw a identity status error when user identity is not verified', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const providerRef = 'abc123';

            const request: NewWithdrawalRequestModel = {
                providerRef
            };

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    addressStatus: UserAddressStatus.Complete,
                    identityStatus: UserVerificationStatus.Pending,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.add(request);

            // Then
            await expect(delegate()).to.be.rejectedWith(BadRequestError, 'User identity must be verified');
        });

        it('should throw a wallet not found error when user does not have a withdrawable wallet account', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const providerRef = 'abc123';

            const request: NewWithdrawalRequestModel = {
                providerRef
            };

            when(mockAccountManager.getForUser(userId, UserWalletAccounts.Withdrawable)).thenResolve(undefined);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    addressStatus: UserAddressStatus.Complete,
                    identityStatus: UserVerificationStatus.Verified,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.add(request);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Wallet not found.');
        });

        it('should throw a minimum balance of USD 100 error when the balance is below 100', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const providerRef = 'abc123';

            const balance = 30;
            const currencyCode = 'USD';
            const account: WalletAccount = {
                id: 1,
                name: UserWalletAccounts.Withdrawable,
                balance,
                balanceRaw: 0,
                baseBalance: 0,
                currencyCode,
                walletId: 1,
                allowNegative: false,
                createTime: new Date(),
                balanceUpdateTime: new Date()
            };

            const withdrawalRequest: WithdrawalRequest = {
                id: 'b3a535a3-62de-4fee-8e2d-7bf3195b4e07',
                provider: WithdrawalProvider.PayPal,
                amount: balance,
                currencyCode: 'USD',
                requesterId: userId.toString(),
                requesterType: RequesterType.User,
                status: WithdrawalRequestStatus.Pending,
                targetCompletionTime: new Date(),
                userId,
                walletEntryId: 1,
                createTime: new Date(),
                updateTime: new Date()
            };

            const newWithdrawalRequest: NewWithdrawalRequest = {
                userId,
                provider: WithdrawalProvider.PayPal,
                providerRef,
                amount: balance,
                targetCompletionTime: withdrawalRequest.targetCompletionTime
            };

            const request: NewWithdrawalRequestModel = {
                providerRef
            };

            when(mockWithdrawalManager.add(newWithdrawalRequest, anything())).thenResolve(withdrawalRequest);
            when(mockAccountManager.getForUser(userId, UserWalletAccounts.Withdrawable)).thenResolve(account);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    addressStatus: UserAddressStatus.Complete,
                    identityStatus: UserVerificationStatus.Verified,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.add(request);

            // Then
            await expect(delegate()).to.be.rejectedWith(BadRequestError, 'You must have a minimum balance of USD 100 to withdraw.');
        });

        it('should throw a minimum balance of USD 100 error when the balance is below 100 when level config exists without currency', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const providerRef = 'abc123';
            const userLevel = 1;

            const balance = 30;
            const currencyCode = 'USD';
            const account: WalletAccount = {
                id: 1,
                name: UserWalletAccounts.Withdrawable,
                balance,
                balanceRaw: 0,
                baseBalance: 0,
                currencyCode,
                walletId: 1,
                allowNegative: false,
                createTime: new Date(),
                balanceUpdateTime: new Date()
            };

            const withdrawalRequest: WithdrawalRequest = {
                id: 'b3a535a3-62de-4fee-8e2d-7bf3195b4e07',
                provider: WithdrawalProvider.PayPal,
                amount: balance,
                currencyCode: 'USD',
                requesterId: userId.toString(),
                requesterType: RequesterType.User,
                status: WithdrawalRequestStatus.Pending,
                targetCompletionTime: new Date(),
                userId,
                walletEntryId: 1,
                createTime: new Date(),
                updateTime: new Date()
            };

            const newWithdrawalRequest: NewWithdrawalRequest = {
                userId,
                provider: WithdrawalProvider.PayPal,
                providerRef,
                amount: balance,
                targetCompletionTime: withdrawalRequest.targetCompletionTime
            };

            const levelConfig: UpgradeLevelConfig = {
                level: userLevel,
                skinId: 'tournament',
                tournamentMaxActiveEntries: 1,
                withdrawalMinAmounts: {},
                withdrawalTargetDays: 7,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const request: NewWithdrawalRequestModel = {
                providerRef
            };

            when(mockWithdrawalManager.add(newWithdrawalRequest, anything())).thenResolve(withdrawalRequest);
            when(mockAccountManager.getForUser(userId, UserWalletAccounts.Withdrawable)).thenResolve(account);
            when(mockUpgradeConfigManger.getForLevel(skinId, userLevel)).thenResolve(levelConfig);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    addressStatus: UserAddressStatus.Complete,
                    identityStatus: UserVerificationStatus.Verified,
                    type: userType,
                    level: userLevel
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.add(request);

            // Then
            await expect(delegate()).to.be.rejectedWith(BadRequestError, 'You must have a minimum balance of USD 100 to withdraw.');
        });

        it('should throw a minimum balance of USD 75 error when the balance is below 75 when level config exists with currency', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const providerRef = 'abc123';
            const userLevel = 1;
            const minAmount = 75;

            const balance = 30;
            const currencyCode = 'USD';
            const account: WalletAccount = {
                id: 1,
                name: UserWalletAccounts.Withdrawable,
                balance,
                balanceRaw: 0,
                baseBalance: 0,
                currencyCode,
                walletId: 1,
                allowNegative: false,
                createTime: new Date(),
                balanceUpdateTime: new Date()
            };

            const withdrawalRequest: WithdrawalRequest = {
                id: 'b3a535a3-62de-4fee-8e2d-7bf3195b4e07',
                provider: WithdrawalProvider.PayPal,
                amount: balance,
                currencyCode: 'USD',
                requesterId: userId.toString(),
                requesterType: RequesterType.User,
                status: WithdrawalRequestStatus.Pending,
                targetCompletionTime: new Date(),
                userId,
                walletEntryId: 1,
                createTime: new Date(),
                updateTime: new Date()
            };

            const newWithdrawalRequest: NewWithdrawalRequest = {
                userId,
                provider: WithdrawalProvider.PayPal,
                providerRef,
                amount: balance,
                targetCompletionTime: withdrawalRequest.targetCompletionTime
            };

            const levelConfig: UpgradeLevelConfig = {
                level: userLevel,
                skinId: 'tournament',
                tournamentMaxActiveEntries: 1,
                withdrawalMinAmounts: {
                    USD: minAmount
                },
                withdrawalTargetDays: 7,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const request: NewWithdrawalRequestModel = {
                providerRef
            };

            when(mockWithdrawalManager.add(newWithdrawalRequest, anything())).thenResolve(withdrawalRequest);
            when(mockAccountManager.getForUser(userId, UserWalletAccounts.Withdrawable)).thenResolve(account);
            when(mockUpgradeConfigManger.getForLevel(skinId, userLevel)).thenResolve(levelConfig);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    addressStatus: UserAddressStatus.Complete,
                    identityStatus: UserVerificationStatus.Verified,
                    type: userType,
                    level: userLevel
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.add(request);

            // Then
            await expect(delegate()).to.be.rejectedWith(BadRequestError, 'You must have a minimum balance of USD 75 to withdraw.');
        });

        it('should return a new request', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const providerRef = 'abc123';

            const balance = 512.54;
            const currencyCode = 'USD';
            const account: WalletAccount = {
                id: 1,
                name: UserWalletAccounts.Withdrawable,
                balance,
                balanceRaw: 0,
                baseBalance: 0,
                currencyCode,
                walletId: 1,
                allowNegative: false,
                createTime: new Date(),
                balanceUpdateTime: new Date()
            };

            const withdrawalRequest: WithdrawalRequest = {
                id: 'b3a535a3-62de-4fee-8e2d-7bf3195b4e07',
                provider: WithdrawalProvider.PayPal,
                providerRef,
                amount: balance,
                currencyCode: 'USD',
                requesterId: userId.toString(),
                requesterType: RequesterType.User,
                status: WithdrawalRequestStatus.Pending,
                targetCompletionTime: new Date(),
                userId,
                walletEntryId: 1,
                createTime: new Date(),
                updateTime: new Date()
            };

            const newWithdrawalRequest: NewWithdrawalRequest = {
                userId,
                provider: WithdrawalProvider.PayPal,
                providerRef,
                amount: balance,
                targetCompletionTime: anything()
            };

            const request: NewWithdrawalRequestModel = {
                providerRef
            };

            when(mockWithdrawalManager.add(deepEqual(newWithdrawalRequest))).thenResolve(withdrawalRequest);
            when(mockAccountManager.getForUser(userId, UserWalletAccounts.Withdrawable)).thenResolve(account);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    addressStatus: UserAddressStatus.Complete,
                    identityStatus: UserVerificationStatus.Verified,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.add(request);

            // Then
            expect(result).to.exist;
            expect(result).to.deep.equal({
                id: withdrawalRequest.id,
                provider: withdrawalRequest.provider,
                providerRef: withdrawalRequest.providerRef,
                amount: withdrawalRequest.amount,
                currencyCode: withdrawalRequest.currencyCode,
                status: withdrawalRequest.status,
                targetCompletionTime: withdrawalRequest.targetCompletionTime,
                createTime: withdrawalRequest.createTime,
                updateTime: withdrawalRequest.updateTime
            });
        });
    });

    describe('cancel()', () => {
        it('should throw a withdrawal request not found error when it does not exist', async () => {
            // Given
            const requestId = 'b3a535a3-62de-4fee-8e2d-7bf3195b4e07';

            when(mockWithdrawalManager.get(requestId)).thenResolve(undefined);

            const controller = getController();

            // When
            const delegate = async () => controller.cancel(requestId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Withdrawal request not found.');
        });

        it('should throw a withdrawal request not found error when it does not belong to the user', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const requestId = 'b3a535a3-62de-4fee-8e2d-7bf3195b4e07';

            const withdrawalRequest: WithdrawalRequest = {
                id: requestId,
                provider: WithdrawalProvider.PayPal,
                amount: 123.12,
                currencyCode: 'USD',
                requesterId: userId.toString(),
                requesterType: RequesterType.User,
                status: WithdrawalRequestStatus.Pending,
                targetCompletionTime: new Date(),
                userId: 5,
                walletEntryId: 1,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockWithdrawalManager.get(requestId)).thenResolve(withdrawalRequest);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.cancel(requestId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Withdrawal request not found.');
        });

        it('should cancel the withdrawal request', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const requestId = 'b3a535a3-62de-4fee-8e2d-7bf3195b4e07';

            const withdrawalRequest: WithdrawalRequest = {
                id: requestId,
                provider: WithdrawalProvider.PayPal,
                amount: 123.12,
                currencyCode: 'USD',
                requesterId: userId.toString(),
                requesterType: RequesterType.User,
                status: WithdrawalRequestStatus.Pending,
                targetCompletionTime: new Date(),
                userId,
                walletEntryId: 1,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockWithdrawalManager.get(requestId)).thenResolve(withdrawalRequest);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            await controller.cancel(requestId);

            // Then
            verify(mockWithdrawalManager.cancel(requestId)).once();
        });
    });
});