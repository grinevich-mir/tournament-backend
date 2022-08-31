import { describe, it } from '@tcom/test';
import { mock, instance, reset, when, verify, deepEqual, mockUserRequest, mockUser } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { SubscriptionController } from '../../src/controllers/subscription.controller';
import { SubscriptionUpgradeManager, SubscriptionUpgradeUpdateResult, SubscriptionUpgrade, UpgradeStatus, UpgradeType } from '@tcom/platform/lib/upgrade';
import {
    SubscriptionTierManager,
    SubscriptionManager,
    SubscriptionTierFilter,
    SubscriptionTier,
    SubscriptionPromo,
    SubscriptionPeriod
} from '@tcom/platform/lib/subscription';
import { User, UserManager, UserType } from '@tcom/platform/lib/user';
import { SubscriptionModelMapper } from '@tcom/platform/lib/subscription/models';
import { NotFoundError } from '@tcom/platform/lib/core';
import { generateSubscription, generateSubscriptionTier, generateSubscriptionModel } from '../helpers';
import { SubscriptionOptionsModel, UpgradeSubscriptionTierChangeModel } from '../../src/models';
import { PaymentProvider } from '@tcom/platform/lib/payment';

describe('UpgradeSubscriptionController', () => {
    const mockSubscriptionTierManager = mock(SubscriptionTierManager);
    const mockSubscriptionUpgradeManager = mock(SubscriptionUpgradeManager);
    const mockSubscriptionManager = mock(SubscriptionManager);
    const mockUserManager = mock(UserManager);
    const mockModelMapper = mock(SubscriptionModelMapper);

    function getController(): SubscriptionController {
        return new SubscriptionController(
            instance(mockSubscriptionTierManager),
            instance(mockSubscriptionUpgradeManager),
            instance(mockSubscriptionManager),
            instance(mockModelMapper));
    }

    beforeEach(() => {
        reset(mockSubscriptionTierManager);
        reset(mockSubscriptionUpgradeManager);
        reset(mockSubscriptionManager);
        reset(mockUserManager);
        reset(mockModelMapper);
    });

    describe('getLatest()', () => {
        it('should throw a not found error if a subscription does not exist', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            when(mockSubscriptionManager.getLatest(userId)).thenResolve(undefined);

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
            const delegate = async () => controller.getLatest();

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Subscription not found');
        });

        it('should throw a not found error if the subscriptions tier does not exist', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const tierId = 1;

            const subscription = generateSubscription();

            when(mockSubscriptionManager.getLatest(userId)).thenResolve(subscription);
            when(mockSubscriptionTierManager.get(tierId)).thenResolve(undefined);

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
            const delegate = async () => controller.getLatest();

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Subscription tier not found');
        });

        it('should return subscription', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const tierId = 1;

            const subscription = generateSubscription();
            const tier = generateSubscriptionTier();
            const subscriptionModel = generateSubscriptionModel();

            when(mockSubscriptionManager.getLatest(userId)).thenResolve(subscription);
            when(mockSubscriptionTierManager.get(tierId)).thenResolve(tier);
            when(mockModelMapper.map(subscription, tier)).thenReturn(subscriptionModel);

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
            const result = await controller.getLatest();

            // Then
            expect(result).to.exist;
            expect(result).to.equal(subscriptionModel);
            verify(mockModelMapper.map(subscription, tier)).once();
        });

        it('should return subscription with next tier', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const tierId = 1;
            const nextTierId = 2;

            const subscription = generateSubscription();
            subscription.nextTierId = nextTierId;
            const tier = generateSubscriptionTier();
            const subscriptionModel = generateSubscriptionModel();

            when(mockSubscriptionManager.getLatest(userId)).thenResolve(subscription);
            when(mockSubscriptionTierManager.get(tierId)).thenResolve(tier);
            when(mockModelMapper.map(subscription, tier)).thenReturn(subscriptionModel);

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
            const result = await controller.getLatest();

            // Then
            expect(result).to.exist;
            expect(result).to.equal(subscriptionModel);
            verify(mockModelMapper.map(subscription, tier)).once();
        });
    });

    describe('create()', () => {
        it('should throw a not found error if a subscription tier does not exist', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const tierId = 1;

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
            const delegate = async () => controller.create(tierId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Subscription tier not found');
        });

        it('should throw a not found error if a subscription tier is not enabled', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const tierId = 1;

            const tier = generateSubscriptionTier(tierId);
            tier.enabled = false;

            when(mockSubscriptionTierManager.get(tierId)).thenResolve(tier);

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
            const delegate = async () => controller.create(tierId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Subscription tier not found');
        });

        it('should create a subscription with a variant', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const tierId = 1;
            const level = 1;
            const provider = PaymentProvider.Chargify;

            const subscription = generateSubscription();
            const tier = generateSubscriptionTier();
            const subscriptionModel = generateSubscriptionModel();
            const upgrade: SubscriptionUpgrade = {
                id: 1,
                level,
                userId,
                status: UpgradeStatus.Active,
                subscriptionId: subscription.id,
                type: UpgradeType.Subscription,
                createTime: new Date(),
                updateTime: new Date()
            };

            const options: SubscriptionOptionsModel = {
                variantId: 1
            };

            const upgradeResult: SubscriptionUpgradeUpdateResult = {
                level,
                subscription,
                upgrade
            };

            when(mockSubscriptionTierManager.get(tierId)).thenResolve(tier);
            when(mockSubscriptionUpgradeManager.create(provider, userId, tier, options.variantId)).thenResolve(upgradeResult);
            when(mockModelMapper.map(subscription, tier)).thenReturn(subscriptionModel);

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
            const result = await controller.create(tierId, options);

            // Then
            expect(result).to.exist;
            expect(result.userLevel).to.equal(level);
            expect(result.subscription).to.equal(subscriptionModel);
        });

        it('should create a subscription', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const tierId = 1;
            const level = 1;
            const provider = PaymentProvider.Chargify;

            const subscription = generateSubscription();
            const tier = generateSubscriptionTier();
            const subscriptionModel = generateSubscriptionModel();
            const upgrade: SubscriptionUpgrade = {
                id: 1,
                level,
                userId,
                status: UpgradeStatus.Active,
                subscriptionId: subscription.id,
                type: UpgradeType.Subscription,
                createTime: new Date(),
                updateTime: new Date()
            };

            const upgradeResult: SubscriptionUpgradeUpdateResult = {
                level,
                subscription,
                upgrade
            };

            when(mockSubscriptionTierManager.get(tierId)).thenResolve(tier);
            when(mockSubscriptionUpgradeManager.create(provider, userId, tier, undefined)).thenResolve(upgradeResult);
            when(mockModelMapper.map(subscription, tier)).thenReturn(subscriptionModel);

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
            const result = await controller.create(tierId);

            // Then
            expect(result).to.exist;
            expect(result.userLevel).to.equal(level);
            expect(result.subscription).to.equal(subscriptionModel);
        });
    });

    describe('getTiers()', () => {
        it('should throw a not found error if there are no enabled tiers', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const tierFilter: SubscriptionTierFilter = {
                skinId
            };

            const tiers: SubscriptionTier[] = [];

            when(mockSubscriptionTierManager.getAll(deepEqual(tierFilter))).thenResolve(tiers);

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
            const delegate = async () => controller.getTiers();

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'No upgrade tiers found');
        });

        it('should return subscription tiers with trial info', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const tierFilter: SubscriptionTierFilter = {
                skinId
            };

            const tier = generateSubscriptionTier();
            tier.variants[0].trialEnabled = true;
            const tiers: SubscriptionTier[] = [tier];

            when(mockSubscriptionTierManager.getAll(deepEqual(tierFilter))).thenResolve(tiers);
            when(mockSubscriptionManager.getLatest(userId)).thenResolve(undefined);

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
            const result = await controller.getTiers();

            // Then
            expect(result).to.exist;
            expect(result.currentLevel).to.equal(0);
            expect(result.tiers).to.be.lengthOf(2);
            expect(result.tiers[0]).to.deep.equal({
                id: 0,
                name: 'Free',
                level: 0
            });
            expect(result.tiers[1]).to.deep.equal({
                id: tier.id,
                name: tier.name,
                level: tier.level,
                variants: [
                    {
                        id: 1,
                        name: 'Default',
                        period: SubscriptionPeriod.Month,
                        frequency: 1,
                        trialPeriod: SubscriptionPeriod.Day,
                        trialDuration: 1,
                        prices: {
                            USD: {
                                amount: 10,
                                trialAmount: 0
                            }
                        }
                    }
                ]
            });
        });

        it('should return subscription tiers when never subscribed', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const tierFilter: SubscriptionTierFilter = {
                skinId
            };

            const tier = generateSubscriptionTier();
            const tiers: SubscriptionTier[] = [tier];

            when(mockSubscriptionTierManager.getAll(deepEqual(tierFilter))).thenResolve(tiers);
            when(mockSubscriptionManager.getLatest(userId)).thenResolve(undefined);

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
            const result = await controller.getTiers();

            // Then
            expect(result).to.exist;
            expect(result.currentLevel).to.equal(0);
            expect(result.tiers).to.be.lengthOf(2);
            expect(result.tiers[0]).to.deep.equal({
                id: 0,
                name: 'Free',
                level: 0
            });
            expect(result.tiers[1]).to.deep.equal({
                id: tier.id,
                name: tier.name,
                level: tier.level,
                variants: [
                    {
                        id: 1,
                        name: 'Default',
                        period: SubscriptionPeriod.Month,
                        frequency: 1,
                        trialPeriod: undefined,
                        trialDuration: undefined,
                        prices: {
                            USD: {
                                amount: 10,
                                trialAmount: undefined
                            }
                        }
                    }
                ]
            });
        });

        it('should return subscription tiers when subscribed', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const tierFilter: SubscriptionTierFilter = {
                skinId
            };

            const subscription = generateSubscription();
            const tier = generateSubscriptionTier();
            const tiers: SubscriptionTier[] = [tier];

            when(mockSubscriptionTierManager.getAll(deepEqual(tierFilter))).thenResolve(tiers);
            when(mockSubscriptionManager.getLatest(userId)).thenResolve(subscription);

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
            const result = await controller.getTiers();

            // Then
            expect(result).to.exist;
            expect(result.currentLevel).to.equal(1);
            expect(result.tiers).to.be.lengthOf(2);
            expect(result.tiers[0]).to.deep.equal({
                id: 0,
                name: 'Free',
                level: 0
            });
            expect(result.tiers[1]).to.deep.equal({
                id: tier.id,
                name: tier.name,
                level: tier.level,
                variants: [
                    {
                        id: 1,
                        name: 'Default',
                        period: SubscriptionPeriod.Month,
                        frequency: 1,
                        trialPeriod: undefined,
                        trialDuration: undefined,
                        prices: {
                            USD: {
                                amount: 10,
                                trialAmount: undefined
                            }
                        }
                    }
                ]
            });
        });

        it('should return subscription tiers when subscribed with available promo', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const tierFilter: SubscriptionTierFilter = {
                skinId
            };

            const subscription = generateSubscription();
            const tier = generateSubscriptionTier();
            const tiers: SubscriptionTier[] = [tier];

            const promo: SubscriptionPromo = {
                id: 1,
                skinId,
                cycles: 1,
                period: SubscriptionPeriod.Month,
                onCancellation: true,
                onDowngrade: true,
                expireIn: 30,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockSubscriptionTierManager.getAll(deepEqual(tierFilter))).thenResolve(tiers);
            when(mockSubscriptionManager.getLatest(userId)).thenResolve(subscription);
            when(mockSubscriptionUpgradeManager.getPromo(userId)).thenResolve(promo);

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
            const result = await controller.getTiers();

            // Then
            expect(result).to.exist;
            expect(result.currentLevel).to.equal(1);
            expect(result.promo).to.deep.equal({
                cycles: promo.cycles,
                period: promo.period,
                onCancellation: promo.onCancellation,
                onDowngrade: promo.onDowngrade
            });
            expect(result.tiers).to.be.lengthOf(2);
            expect(result.tiers[0]).to.deep.equal({
                id: 0,
                name: 'Free',
                level: 0
            });
            expect(result.tiers[1]).to.deep.equal({
                id: tier.id,
                name: tier.name,
                level: tier.level,
                variants: [
                    {
                        id: 1,
                        name: 'Default',
                        period: SubscriptionPeriod.Month,
                        frequency: 1,
                        trialPeriod: undefined,
                        trialDuration: undefined,
                        prices: {
                            USD: {
                                amount: 10,
                                trialAmount: undefined
                            }
                        }
                    }
                ]
            });
        });

        it('should return subscription tiers when subscribed with pending tier change', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const nextTierId = 2;
            const nextTierTime = new Date();
            const tierFilter: SubscriptionTierFilter = {
                skinId
            };

            const subscription = generateSubscription();
            subscription.nextTierId = nextTierId;
            subscription.nextTierTime = nextTierTime;
            const tier = generateSubscriptionTier();
            const nextTier = generateSubscriptionTier(nextTierId, nextTierId);
            const tiers: SubscriptionTier[] = [tier];

            when(mockSubscriptionTierManager.getAll(deepEqual(tierFilter))).thenResolve(tiers);
            when(mockSubscriptionTierManager.get(nextTierId)).thenResolve(nextTier);
            when(mockSubscriptionManager.getLatest(userId)).thenResolve(subscription);

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
            const result = await controller.getTiers();

            // Then
            expect(result).to.exist;
            expect(result.currentLevel).to.equal(1);
            expect(result.nextLevel).to.equal(nextTier.level);
            expect(result.nextTierTime).to.equal(nextTierTime);
            expect(result.tiers).to.be.lengthOf(2);
            expect(result.tiers[0]).to.deep.equal({
                id: 0,
                name: 'Free',
                level: 0
            });
            expect(result.tiers[1]).to.deep.equal({
                id: tier.id,
                name: tier.name,
                level: tier.level,
                variants: [
                    {
                        id: 1,
                        name: 'Default',
                        period: SubscriptionPeriod.Month,
                        frequency: 1,
                        trialPeriod: undefined,
                        trialDuration: undefined,
                        prices: {
                            USD: {
                                amount: 10,
                                trialAmount: undefined
                            }
                        }
                    }
                ]
            });
        });

        it('should return subscription tiers when subscribed with pending cancellation', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const tierFilter: SubscriptionTierFilter = {
                skinId
            };
            const cancelledTime = new Date();

            const subscription = generateSubscription();
            subscription.cancelledTime = cancelledTime;
            const tier = generateSubscriptionTier();
            const tiers: SubscriptionTier[] = [tier];

            when(mockSubscriptionTierManager.getAll(deepEqual(tierFilter))).thenResolve(tiers);
            when(mockSubscriptionManager.getLatest(userId)).thenResolve(subscription);

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
            const result = await controller.getTiers();

            // Then
            expect(result).to.exist;
            expect(result.currentLevel).to.equal(1);
            expect(result.nextLevel).to.equal(0);
            expect(result.nextTierTime).to.equal(cancelledTime);
            expect(result.tiers).to.be.lengthOf(2);
            expect(result.tiers[0]).to.deep.equal({
                id: 0,
                name: 'Free',
                level: 0
            });
            expect(result.tiers[1]).to.deep.equal({
                id: tier.id,
                name: tier.name,
                level: tier.level,
                variants: [
                    {
                        id: 1,
                        name: 'Default',
                        period: SubscriptionPeriod.Month,
                        frequency: 1,
                        trialPeriod: undefined,
                        trialDuration: undefined,
                        prices: {
                            USD: {
                                amount: 10,
                                trialAmount: undefined
                            }
                        }
                    }
                ]
            });
        });
    });

    describe('changeTier()', () => {
        it('should cancel the subscription if the requested level is zero', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const newTierId = 0;
            const cancelDate = new Date();

            const change: UpgradeSubscriptionTierChangeModel = {
                tierId: newTierId
            };

            when(mockSubscriptionUpgradeManager.cancel(userId, true)).thenResolve(cancelDate);

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
            const result = await controller.changeTier(change);

            // Then
            expect(result).to.exist;
            expect(result).to.deep.equal({
                nextLevel: 0,
                nextTierId: 0,
                nextTierTime: cancelDate
            });
        });

        it('should change subscription tier', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const newTierId = 1;

            const change: UpgradeSubscriptionTierChangeModel = {
                tierId: newTierId
            };

            const subscription = generateSubscription();
            const upgrade: SubscriptionUpgrade = {
                id: 1,
                level: newTierId,
                userId,
                status: UpgradeStatus.Active,
                subscriptionId: subscription.id,
                type: UpgradeType.Subscription,
                createTime: new Date(),
                updateTime: new Date()
            };

            const changeResult: SubscriptionUpgradeUpdateResult = {
                level: newTierId,
                upgrade,
                subscription
            };

            when(mockSubscriptionUpgradeManager.changeTier(userId, newTierId, undefined, true)).thenResolve(changeResult);

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
            const result = await controller.changeTier(change);

            // Then
            expect(result).to.exist;
            expect(result).to.deep.equal({
                level: newTierId,
                nextLevel: undefined,
                nextTierId: undefined,
                nextTierTime: undefined
            });
        });

        it('should change subscription tier with pending tier change', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const currentLevel = 0;
            const newTierId = 1;
            const nextTierTime = new Date();

            const change: UpgradeSubscriptionTierChangeModel = {
                tierId: newTierId
            };

            const subscription = generateSubscription();
            const nextTier = generateSubscriptionTier();
            const upgrade: SubscriptionUpgrade = {
                id: 1,
                level: newTierId,
                userId,
                status: UpgradeStatus.Active,
                subscriptionId: subscription.id,
                type: UpgradeType.Subscription,
                createTime: new Date(),
                updateTime: new Date()
            };

            const changeResult: SubscriptionUpgradeUpdateResult = {
                level: currentLevel,
                nextTier,
                nextTierTime,
                upgrade,
                subscription
            };

            when(mockSubscriptionUpgradeManager.changeTier(userId, newTierId, undefined, true)).thenResolve(changeResult);

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
            const result = await controller.changeTier(change);

            // Then
            expect(result).to.exist;
            expect(result).to.deep.equal({
                level: currentLevel,
                nextLevel: nextTier.level,
                nextTierId: nextTier.id,
                nextTierTime
            });
        });
    });

    describe('getPromo()', () => {
        it('should throw not found error if subscription does not exist', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

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
            const delegate = async () => controller.getPromo();

            // Then
            expect(delegate()).to.be.rejectedWith(NotFoundError, 'Subscription not found');
        });

        it('should throw not found error if subscription tier does not exist', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const subscription = generateSubscription();

            when(mockSubscriptionManager.getLatest(userId)).thenResolve(subscription);

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
            const delegate = async () => controller.getPromo();

            // Then
            expect(delegate()).to.be.rejectedWith(NotFoundError, 'Subscription tier not found');
        });

        it('should return false if no promo is available', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const subscription = generateSubscription();
            const tier = generateSubscriptionTier();

            when(mockSubscriptionManager.getLatest(userId)).thenResolve(subscription);
            when(mockSubscriptionTierManager.get(subscription.tierId)).thenResolve(tier);

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
            const result = await controller.getPromo();

            // Then
            expect(result).to.be.false;
        });

        it('should return promo if available', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const subscription = generateSubscription();
            const tier = generateSubscriptionTier();
            const promo: SubscriptionPromo = {
                id: 1,
                cycles: 1,
                period: SubscriptionPeriod.Month,
                onCancellation: true,
                onDowngrade: true,
                enabled: true,
                expireIn: 12,
                skinId,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockSubscriptionManager.getLatest(userId)).thenResolve(subscription);
            when(mockSubscriptionTierManager.get(subscription.tierId)).thenResolve(tier);
            when(mockSubscriptionUpgradeManager.getPromo(userId)).thenResolve(promo);

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
            const result = await controller.getPromo();

            // Then
            expect(result).to.deep.equal({
                cycles: 1,
                period: promo.period,
                onCancellation: true,
                onDowngrade: true
            });
        });
    });

    describe('acceptPromo()', () => {
        it('should accept the current promo', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

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
            await controller.acceptPromo();

            // Then
            verify(mockSubscriptionUpgradeManager.acceptPromo(userId)).once();
        });
    });

    describe('declinePromo()', () => {
        it('should decline the current promo', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

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
            await controller.declinePromo();

            // Then
            verify(mockSubscriptionUpgradeManager.declinePromo(userId)).once();
        });
    });
});