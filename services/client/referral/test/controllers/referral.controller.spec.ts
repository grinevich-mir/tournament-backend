import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { User, UserType } from '@tcom/platform/lib/user';
import { describe } from '@tcom/test';
import { expect } from '@tcom/test/assert';
import { anything, instance, mock, mockUser, mockUserRequest, reset, when, deepEqual } from '@tcom/test/mock';
import { ReferralController } from '../../src/controllers/referral.controller';
import { Referral, ReferralManager, ReferralUser, ReferralUserManager, ReferralCommissionManager, ReferralCommissionRate } from '@tcom/platform/lib/referral';
import { ReferralModelMapper, ReferralUserModelMapper } from '../../src/models/mappers';
import { PublicReferralUserModel, ReferralModel, ReferralUserModel } from '../../src/models';

describe('ReferralController', () => {
    const mockReferralManager = mock(ReferralManager);
    const mockReferralUserManager = mock(ReferralUserManager);
    const mockReferralCommissionManager = mock(ReferralCommissionManager);
    const mockReferralMapper = mock(ReferralModelMapper);
    const mockReferralUserMapper = mock(ReferralUserModelMapper);

    function getController(): ReferralController {
        return new ReferralController(
            instance(mockReferralManager),
            instance(mockReferralUserManager),
            instance(mockReferralCommissionManager),
            instance(mockReferralMapper),
            instance(mockReferralUserMapper));
    }

    beforeEach(() => {
        reset(mockReferralManager);
        reset(mockReferralUserManager);
        reset(mockReferralCommissionManager);
        reset(mockReferralMapper);
        reset(mockReferralUserMapper);
    });

    describe('getUser()', async () => {
        it('should throw a not found error if the referral user does not exist', async () => {
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
            const delegate = async () => controller.getUser();

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Referral user not found');
        });

        it('should return the authenticated referral user', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const referralUser: ReferralUser = {
                userId,
                active: true,
                code: 'ABC12345',
                groupId: 1,
                referralCount: 0,
                revenue: 0,
                rewardCount: 0,
                diamondCount: 0,
                slug: 'ABC12345',
                createTime: new Date(),
                updateTime: new Date()
            };

            const referralUserModel: ReferralUserModel = {
                referralCount: 0,
                revenue: 0,
                rewardCount: 0,
                diamondCount: 0,
                code: 'ABC12345',
                slug: 'ABC12345',
                group: {
                    id: 1,
                    name: 'Default'
                },
                active: true
            };

            when(mockReferralUserMapper.map(referralUser)).thenResolve(referralUserModel);
            when(mockReferralUserManager.get(userId)).thenResolve(referralUser);

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
            const result = await controller.getUser();

            // Then
            expect(result).to.equal(referralUserModel);
        });
    });

    describe('getCommissionRates()', () => {
        it('should throw a not found error if referral user does not exist', async () => {
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
            const delegate = async () => controller.getCommissionRates();

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Referral user not found');
        });

        it('should return the authenticated referral users commission rates', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const referralUser: ReferralUser = {
                userId,
                active: true,
                code: 'ABC12345',
                groupId: 1,
                referralCount: 0,
                diamondCount: 0,
                revenue: 0,
                rewardCount: 0,
                slug: 'ABC12345',
                createTime: new Date(),
                updateTime: new Date()
            };

            const rates: ReferralCommissionRate[] = [
                {
                    groupId: 1,
                    level: 1,
                    minAmount: 0,
                    rate: 10,
                    enabled: true,
                    createTime: new Date(),
                    updateTime: new Date()
                }
            ];

            when(mockReferralUserManager.get(userId)).thenResolve(referralUser);
            when(mockReferralCommissionManager.getRates(deepEqual({
                groupId: referralUser.groupId,
                enabled: true
            }))).thenResolve(rates);

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
            const result = await controller.getCommissionRates();

            // Then
            expect(result).to.equal(rates);
        });
    });

    /*describe('checkSlug()', async () => {
        it('should return a slug check result', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const slug = 'ABC12345';

            const checkResult: ReferralUserSlugCheckResult = {
                available: true,
                valid: true
            };

            const request: ReferralUserSlugCheckModel = {
                slug
            };

            when(mockReferralUserManager.validateSlug(slug, userId)).thenResolve(checkResult);

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
            const result = await controller.checkSlug(request);

            // Then
            expect(result).to.equal(checkResult);
        });
    });*/

    /*describe('setSlug()', async () => {
        it('should set the authenticated referral users slug', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const slug = 'ABC12345';

            const request: ReferralUserSlugChangeModel = {
                slug
            };

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
            await controller.setSlug(request);

            // Then
            verify(mockReferralUserManager.setSlug(userId, slug)).once();
        });
    });*/

    describe('getPublicUserByCode()', async () => {
        it('should throw a not found error if the referral user does not exist', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const code = 'ABC12345';

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
            const delegate = async () => controller.getPublicUserByCode(code);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Referral user not found');
        });

        it('should return the public referral user', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const code = 'ABC12345';
            const slug = '12345ABC';

            const referralUser: ReferralUser = {
                userId,
                active: true,
                code,
                groupId: 1,
                referralCount: 0,
                diamondCount: 0,
                revenue: 0,
                rewardCount: 0,
                slug,
                createTime: new Date(),
                updateTime: new Date()
            };

            const referralUserModel: PublicReferralUserModel = {
                code,
                slug,
                avatarUrl: 'ABC12345',
                displayName: 'Wibble'
            };

            when(mockReferralUserManager.getByCode(code)).thenResolve(referralUser);
            when(mockReferralUserMapper.mapPublic(referralUser)).thenResolve(referralUserModel);

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
            const result = await controller.getPublicUserByCode(code);

            // Then
            expect(result).to.equal(referralUserModel);
        });
    });

    describe('getPublicUserBySlug()', async () => {
        it('should throw a not found error if the referral user does not exist', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const slug = '12345ABC';

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
            const delegate = async () => controller.getPublicUserBySlug(slug);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Referral user not found');
        });

        it('should return the public referral user', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const code = 'ABC12345';
            const slug = '12345ABC';

            const referralUser: ReferralUser = {
                userId,
                active: true,
                code,
                groupId: 1,
                referralCount: 0,
                revenue: 0,
                rewardCount: 0,
                diamondCount: 0,
                slug,
                createTime: new Date(),
                updateTime: new Date()
            };

            const referralUserModel: PublicReferralUserModel = {
                code,
                slug,
                avatarUrl: 'ABC12345',
                displayName: 'Wibble'
            };

            when(mockReferralUserManager.getBySlug(slug)).thenResolve(referralUser);
            when(mockReferralUserMapper.mapPublic(referralUser)).thenResolve(referralUserModel);

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
            const result = await controller.getPublicUserBySlug(slug);

            // Then
            expect(result).to.equal(referralUserModel);
        });
    });

    describe('getAll()', async () => {
        it(`should return the referrals for the authenticated user in default order`, async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const referrals: Referral[] = [
                {
                    id: 1,
                    referrer: {
                        userId: 1,
                        active: false,
                        code: 'ABC12345',
                        groupId: 1,
                        referralCount: 0,
                        revenue: 0,
                        rewardCount: 0,
                        diamondCount: 0,
                        slug: '12345ABC',
                        createTime: new Date(),
                        updateTime: new Date()
                    },
                    referee: {
                        userId: 2,
                        active: false,
                        code: 'ABC12345',
                        groupId: 1,
                        referralCount: 0,
                        revenue: 0,
                        rewardCount: 0,
                        diamondCount: 0,
                        slug: '12345ABC',
                        createTime: new Date(),
                        updateTime: new Date()
                    },
                    rewardCount: 0,
                    revenue: 0,
                    diamondCount: 0,
                    createTime: new Date(),
                    updateTime: new Date()
                },
                {
                    id: 2,
                    referrer: {
                        userId: 1,
                        active: false,
                        code: 'ABC12345',
                        groupId: 1,
                        referralCount: 0,
                        revenue: 0,
                        rewardCount: 0,
                        diamondCount: 0,
                        slug: '12345ABC',
                        createTime: new Date(),
                        updateTime: new Date()
                    },
                    referee: {
                        userId: 3,
                        active: false,
                        code: 'ABC12345',
                        groupId: 1,
                        referralCount: 0,
                        revenue: 0,
                        rewardCount: 0,
                        diamondCount: 0,
                        slug: '12345ABC',
                        createTime: new Date(),
                        updateTime: new Date()
                    },
                    rewardCount: 0,
                    revenue: 0,
                    diamondCount: 0,
                    createTime: new Date(),
                    updateTime: new Date()
                }
            ];

            const referralModels: ReferralModel[] = [
                {
                    id: 1,
                    displayName: 'ABC12345',
                    active: false,
                    revenue: 0,
                    rewardCount: 0,
                    diamondCount: 0,
                    createTime: new Date(),
                    updateTime: new Date()
                },
                {
                    id: 2,
                    displayName: '12345ABC',
                    active: false,
                    revenue: 0,
                    rewardCount: 0,
                    diamondCount: 0,
                    createTime: new Date(),
                    updateTime: new Date()
                }
            ];

            const pagedReferrals = new PagedResult<Referral>(referrals, 0, 1, 20);

            when(mockReferralManager.getByReferrer(userId, anything())).thenResolve(pagedReferrals);
            when(mockReferralMapper.map(referrals[0])).thenResolve(referralModels[0]);
            when(mockReferralMapper.map(referrals[1])).thenResolve(referralModels[1]);

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
            const result = await controller.getAll();

            // Then
            expect(result.items).to.have.members(referralModels);
        });

        const orders: ('created' | 'rewards' | 'revenue')[] = ['created', 'rewards', 'revenue'];
        orders.forEach(order => {
            it(`should return the referrals for the authenticated user in ${order} order`, async () => {
                // Given
                const userId = 1;
                const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
                const skinId = 'tournament';
                const userType = UserType.Standard;

                const referrals: Referral[] = [
                    {
                        id: 1,
                        referrer: {
                            userId: 1,
                            active: false,
                            code: 'ABC12345',
                            groupId: 1,
                            referralCount: 0,
                            revenue: 0,
                            rewardCount: 0,
                            diamondCount: 0,
                            slug: '12345ABC',
                            createTime: new Date(),
                            updateTime: new Date()
                        },
                        referee: {
                            userId: 2,
                            active: false,
                            code: 'ABC12345',
                            groupId: 1,
                            referralCount: 0,
                            revenue: 0,
                            rewardCount: 0,
                            diamondCount: 0,
                            slug: '12345ABC',
                            createTime: new Date(),
                            updateTime: new Date()
                        },
                        rewardCount: 0,
                        revenue: 0,
                        diamondCount: 0,
                        createTime: new Date(),
                        updateTime: new Date()
                    },
                    {
                        id: 2,
                        referrer: {
                            userId: 1,
                            active: false,
                            code: 'ABC12345',
                            groupId: 1,
                            referralCount: 0,
                            revenue: 0,
                            rewardCount: 0,
                            diamondCount: 0,
                            slug: '12345ABC',
                            createTime: new Date(),
                            updateTime: new Date()
                        },
                        referee: {
                            userId: 3,
                            active: false,
                            code: 'ABC12345',
                            groupId: 1,
                            referralCount: 0,
                            revenue: 0,
                            rewardCount: 0,
                            diamondCount: 0,
                            slug: '12345ABC',
                            createTime: new Date(),
                            updateTime: new Date()
                        },
                        rewardCount: 0,
                        revenue: 0,
                        diamondCount: 0,
                        createTime: new Date(),
                        updateTime: new Date()
                    }
                ];

                const referralModels: ReferralModel[] = [
                    {
                        id: 1,
                        displayName: 'ABC12345',
                        active: false,
                        revenue: 0,
                        rewardCount: 0,
                        diamondCount: 0,
                        createTime: new Date(),
                        updateTime: new Date()
                    },
                    {
                        id: 2,
                        displayName: '12345ABC',
                        active: false,
                        revenue: 0,
                        rewardCount: 0,
                        diamondCount: 0,
                        createTime: new Date(),
                        updateTime: new Date()
                    }
                ];

                const pagedReferrals = new PagedResult<Referral>(referrals, 0, 1, 20);

                when(mockReferralManager.getByReferrer(userId, anything())).thenResolve(pagedReferrals);
                when(mockReferralMapper.map(referrals[0])).thenResolve(referralModels[0]);
                when(mockReferralMapper.map(referrals[1])).thenResolve(referralModels[1]);

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
                const result = await controller.getAll(order);

                // Then
                expect(result.items).to.have.members(referralModels);
            });
        });
    });
});