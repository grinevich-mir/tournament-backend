import { describe, it, context } from '@tcom/test';
import { mock, when, instance, reset, mockUserRequest, deepEqual, mockUser, verify } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { TournamentManager, TournamentEntryManager, TournamentState, Tournament } from '@tcom/platform/lib/tournament';
import { TournamentModelMapper, TournamentLaunchInfoModel, UserTournamentModel } from '@tcom/platform/lib/tournament/models';
import { TournamentController } from '../../src/controllers/tournament.controller';
import { NotFoundError, DeviceType, ForbiddenError } from '@tcom/platform/lib/core';
import _ from 'lodash';
import { generateTournaments, generateTournamentModels, generateTournament, generateTournamentModel, generateTournamentEntry, generateTournamentEntryModel, generateUserTournamentModels, generateUserTournamentModel } from '../helpers';
import { TournamentLaunchInfoResolver } from '@tcom/platform/lib/tournament/utilities';
import { JoinTournamentModel } from '../../src/models';
import { User, UserType } from '@tcom/platform/lib/user';
import { Jackpot, JackpotManager, JackpotType } from '@tcom/platform/lib/jackpot';

describe('TournamentController', () => {
    const userId = 1;
    const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
    const skinId = 'tournament';
    const userType = UserType.Standard;

    const mockTournamentManager = mock(TournamentManager);
    const mockTournamentEntryManager = mock(TournamentEntryManager);
    const mockMapper = mock(TournamentModelMapper);
    const mockLaunchInfoResolver = mock(TournamentLaunchInfoResolver);
    const mockJackpotManager = mock(JackpotManager);

    function getController(): TournamentController {
        return new TournamentController(
            instance(mockTournamentManager),
            instance(mockTournamentEntryManager),
            instance(mockMapper),
            instance(mockLaunchInfoResolver),
            instance(mockJackpotManager));
    }

    beforeEach(() => {
        reset(mockTournamentManager);
        reset(mockTournamentEntryManager);
        reset(mockMapper);
        reset(mockLaunchInfoResolver);
        reset(mockJackpotManager);
    });

    describe('getAll()', () => {
        it('should return tournaments', async () => {
            // Given
            const tournaments = generateTournaments(10);
            const tournamentModels = generateTournamentModels(10);

            when(mockTournamentManager.getActive()).thenResolve(tournaments);
            when(mockMapper.mapAll(deepEqual(tournaments))).thenResolve(tournamentModels);

            const controller = getController();

            // When
            const result = await controller.getAll();

            // Then
            expect(result).to.equal(tournamentModels);
        });

        context('user is logged in', () => {
            it('should return tournaments with non-public tournaments filtered out', async () => {
                // Given
                const tournaments = generateTournaments(10);
                tournaments[0].public = false;
                const tournamentModels = generateUserTournamentModels(10);

                const filteredTournaments = tournaments.filter(t => t.public);

                when(mockTournamentManager.getActive()).thenResolve(tournaments);
                when(mockTournamentEntryManager.get(1, userId, true)).thenResolve(undefined);
                when(mockMapper.mapAll(deepEqual(filteredTournaments))).thenResolve(tournamentModels);
                when(mockMapper.mapAllocationInfo(tournamentModels[0], undefined)).thenResolve();

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
                expect(result).to.deep.equal(tournamentModels);
                expect(result).each.to.have.property('playerJoined').that.is.false;
                expect(result).each.to.have.property('playerCompleted').that.is.false;
            });

            it('should return tournaments with tournaments with a max level less than the user level filtered out', async () => {
                // Given
                const tournaments = generateTournaments(10);
                const tournamentModels = generateTournamentModels(10) as UserTournamentModel[];
                tournamentModels[0].maxLevel = 0;

                const filteredModels = tournamentModels.filter(t => t.playerJoined || (t.maxLevel === undefined || t.maxLevel === null || 1 <= t.maxLevel));

                when(mockTournamentManager.getActive()).thenResolve(tournaments);
                when(mockTournamentEntryManager.get(1, userId, true)).thenResolve(undefined);
                when(mockMapper.mapAll(deepEqual(tournaments))).thenResolve(tournamentModels);

                const controller = getController();

                const mockRequest = mockUserRequest<User>({
                    user: mockUser({
                        id: userId,
                        secureId: userSecureId,
                        level: 1,
                        skinId,
                        type: userType
                    })
                });
                controller.setRequest(instance(mockRequest));

                // When
                const result = await controller.getAll();

                // Then
                expect(result).to.deep.equal(filteredModels);
            });

            it('should return tournaments with the player not marked as joined and completed there the user has not joined', async () => {
                // Given
                const tournaments = generateTournaments(10);
                const tournamentModels = generateUserTournamentModels(10);

                const entry = generateTournamentEntry(1, userId);
                entry.allocations[0].complete = true;
                entry.allocations[1].complete = true;

                when(mockTournamentManager.getActive()).thenResolve(tournaments);
                when(mockTournamentEntryManager.get(1, userId, true)).thenResolve(entry);
                when(mockMapper.mapAll(deepEqual(tournaments))).thenResolve(tournamentModels);
                when(mockMapper.mapAllocationInfo(tournamentModels[0], entry)).thenResolve();

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
                expect(result).to.deep.equal(tournamentModels);
                verify(mockMapper.mapAllocationInfo(tournamentModels[0], entry)).once();
            });

            it('should return all tournaments if user is not a standard user', async () => {
                // Given
                const tournaments = generateTournaments(10);
                const tournamentModels = generateTournamentModels(10);

                when(mockTournamentManager.getActive()).thenResolve(tournaments);
                when(mockMapper.mapAll(tournaments)).thenResolve(tournamentModels);

                const controller = getController();

                const mockRequest = mockUserRequest<User>({
                    user: mockUser({
                        id: userId,
                        secureId: userSecureId,
                        skinId,
                        type: UserType.Internal
                    })
                });
                controller.setRequest(instance(mockRequest));

                // When
                const result = await controller.getAll();

                // Then
                expect(result).to.equal(tournamentModels);
            });
        });
    });

    describe('getJackpots()', () => {
        it('should return an empty array when there are no tournaments', async () => {
            // Given
            const tournaments: Tournament[] = [];

            when(mockTournamentManager.getActive()).thenResolve(tournaments);

            const controller = getController();

            // When
            const result = await controller.getJackpots();

            // Then
            expect(result).to.be.empty;
        });

        it('should return an empty array if no tournaments have jackpot triggers', async () => {
            // Given
            const tournaments = generateTournaments(5);

            when(mockTournamentManager.getActive()).thenResolve(tournaments);

            const controller = getController();

            // When
            const result = await controller.getJackpots();

            // Then
            expect(result).to.be.empty;
        });

        it('should return jackpots with disabled ones filtered out', async () => {
            // Given
            const tournaments = generateTournaments(5);
            tournaments[0].jackpotTriggers = [{
                jackpotId: 1,
                threshold: 100,
                minLevel: 0,
                final: false,
                enabled: true
            }];
            tournaments[1].jackpotTriggers = [{
                jackpotId: 2,
                threshold: 500,
                minLevel: 0,
                final: false,
                enabled: true
            }];

            const jackpots: Jackpot[] = [{
                id: 1,
                type: JackpotType.Fixed,
                name: 'Jackpot 1',
                label: 'Label 1',
                seed: 100,
                balance: 100,
                splitPayout: true,
                enabled: false,
                balanceUpdateTime: new Date(),
                createTime: new Date(),
                updateTime: new Date()
            },
            {
                id: 2,
                type: JackpotType.Fixed,
                name: 'Jackpot 2',
                label: 'Label 2',
                seed: 300,
                balance: 300,
                splitPayout: true,
                enabled: true,
                balanceUpdateTime: new Date(),
                createTime: new Date(),
                updateTime: new Date()
            }];

            when(mockTournamentManager.getActive()).thenResolve(tournaments);
            when(mockJackpotManager.getMany(1, 2)).thenResolve(jackpots);

            const controller = getController();

            // When
            const result = await controller.getJackpots();

            // Then
            expect(result).to.deep.equal([jackpots[1]]);
        });

        it('should return jackpots', async () => {
            // Given
            const tournaments = generateTournaments(5);
            tournaments[0].jackpotTriggers = [{
                jackpotId: 1,
                threshold: 100,
                minLevel: 0,
                final: false,
                enabled: true
            }];
            tournaments[1].jackpotTriggers = [{
                jackpotId: 2,
                threshold: 500,
                minLevel: 0,
                final: false,
                enabled: true
            }];

            const jackpots: Jackpot[] = [{
                id: 1,
                type: JackpotType.Fixed,
                name: 'Jackpot 1',
                label: 'Label 1',
                seed: 100,
                balance: 100,
                splitPayout: true,
                enabled: true,
                balanceUpdateTime: new Date(),
                createTime: new Date(),
                updateTime: new Date()
            },
            {
                id: 2,
                type: JackpotType.Fixed,
                name: 'Jackpot 2',
                label: 'Label 2',
                seed: 300,
                balance: 300,
                splitPayout: true,
                enabled: true,
                balanceUpdateTime: new Date(),
                createTime: new Date(),
                updateTime: new Date()
            }];

            when(mockTournamentManager.getActive()).thenResolve(tournaments);
            when(mockJackpotManager.getMany(1, 2)).thenResolve(jackpots);

            const controller = getController();

            // When
            const result = await controller.getJackpots();

            // Then
            expect(result).to.deep.equal(jackpots);
        });
    });

    describe('getById()', () => {
        it('should throw a not found error when the tournament does not exist', async () => {
            // Given
            const tournamentId = 1;
            when(mockTournamentManager.get(tournamentId)).thenResolve(undefined);

            const controller = getController();

            // When
            const delegate = async () => controller.getById(tournamentId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Tournament not found');
        });

        it('should return the tournament', async () => {
            // Given
            const tournament = generateTournament(1);
            const tournamentModel = generateUserTournamentModel(1);

            const tournamentId = 1;
            when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);
            when(mockMapper.map(tournament)).thenResolve(tournamentModel);

            const controller = getController();

            // When
            const result = await controller.getById(tournamentId);

            // Then
            expect(result).to.deep.equal(tournamentModel);
            expect(result.playerJoined).to.be.false;
            expect(result.playerCompleted).to.be.false;
        });

        context('user is logged in', () => {
            it('should throw a not found error if the user is a higher level than the max level of the tournament', async () => {
                // Given
                const tournamentId = 1;

                const tournament = generateTournament(tournamentId);
                const tournamentModel = generateTournamentModel(tournamentId);
                tournamentModel.maxLevel = 0;

                when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);
                when(mockTournamentEntryManager.get(tournamentId, userId, true)).thenResolve(undefined);
                when(mockMapper.map(tournament)).thenResolve(tournamentModel);

                const controller = getController();

                const mockRequest = mockUserRequest<User>({
                    user: mockUser({
                        id: userId,
                        secureId: userSecureId,
                        level: 2,
                        skinId,
                        type: userType
                    })
                });
                controller.setRequest(instance(mockRequest));

                // When
                const delegate = async () => controller.getById(tournamentId);

                // Then
                await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Tournament not found');
            });

            it('should return the tournament with the player not marked as joined and completed when the user has not joined', async () => {
                // Given
                const tournamentId = 1;

                const tournament = generateTournament(tournamentId);
                const tournamentModel = generateUserTournamentModel(tournamentId);

                when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);
                when(mockTournamentEntryManager.get(tournamentId, userId, true)).thenResolve(undefined);
                when(mockMapper.map(tournament)).thenResolve(tournamentModel);

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
                const result = await controller.getById(tournamentId);

                // Then
                expect(result).to.equal(tournamentModel);
                expect(result.playerJoined).to.be.false;
                expect(result.playerCompleted).to.be.false;
            });

            it('should return a list of tournament with the player marked as joined but not completed when the user has joined', async () => {
                // Given
                const tournamentId = 1;

                const tournament = generateTournament(tournamentId);
                const tournamentModel = generateUserTournamentModel(tournamentId);
                tournamentModel.playerJoined = true;
                tournamentModel.playerCompleted = false;

                const entry = generateTournamentEntry(1, userId);

                when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);
                when(mockTournamentEntryManager.get(tournamentId, userId, true)).thenResolve(entry);
                when(mockMapper.map(tournament)).thenResolve(tournamentModel);

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
                const result = await controller.getById(tournamentId);

                // Then
                expect(result).to.equal(tournamentModel);
                expect(result.playerJoined).to.be.true;
                expect(result.playerCompleted).to.be.false;
            });

            it('should return a list of tournament with the player marked as joined and completed when the player has joined and has completed their allocations', async () => {
                // Given
                const tournamentId = 1;

                const tournament = generateTournament(tournamentId);
                const tournamentModel = generateUserTournamentModel(tournamentId);
                tournamentModel.playerJoined = true;
                tournamentModel.playerCompleted = true;

                const entry = generateTournamentEntry(1, userId);
                entry.allocations[0].complete = true;
                entry.allocations[1].complete = true;

                when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);
                when(mockTournamentEntryManager.get(tournamentId, userId, true)).thenResolve(entry);
                when(mockMapper.map(tournament)).thenResolve(tournamentModel);

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
                const result = await controller.getById(tournamentId);

                // Then
                expect(result).to.equal(tournamentModel);
                expect(result.playerJoined).to.be.true;
                expect(result.playerCompleted).to.be.true;
            });

            it('should return a tournament with the allocation info mapped', async () => {
                // Given
                const tournamentId = 1;

                const tournament = generateTournament(tournamentId);
                const tournamentModel = generateTournamentModel(tournamentId) as UserTournamentModel;

                const entry = generateTournamentEntry(1, userId);
                entry.allocations[0].complete = true;
                entry.allocations[1].complete = true;

                when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);
                when(mockTournamentEntryManager.get(tournamentId, userId, true)).thenResolve(entry);
                when(mockMapper.map(tournament)).thenResolve(tournamentModel);

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
                const result = await controller.getById(tournamentId);

                // Then
                expect(result).to.equal(tournamentModel);
                verify(mockMapper.mapAllocationInfo(tournamentModel, entry)).once();
            });
        });
    });

    describe('getJackpotsForTournament()', () => {
        it('should throw a not found error if tournament does not exist', async () => {
            // Given
            const tournamentId = 1;

            when(mockTournamentManager.get(tournamentId)).thenResolve(undefined);
            const controller = getController();

            // When
            const delegate = async () => controller.getJackpotsForTournament(tournamentId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Tournament not found');
        });

        it('should return and empty array if there are no jackpot triggers', async () => {
            // Given
            const tournamentId = 1;
            const tournament = generateTournament(tournamentId);

            when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);

            const controller = getController();

            // When
            const result = await controller.getJackpotsForTournament(tournamentId);

            // Then
            expect(result).to.be.empty;
        });

        it('should return and empty array if there are no enabled jackpot triggers', async () => {
            // Given
            const tournamentId = 1;
            const tournament = generateTournament(tournamentId);
            tournament.jackpotTriggers = [
                {
                    jackpotId: 1,
                    threshold: 100,
                    minLevel: 0,
                    final: false,
                    enabled: false
                },
                {
                    jackpotId: 2,
                    threshold: 500,
                    minLevel: 0,
                    final: false,
                    enabled: false
                }
            ];

            when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);

            const controller = getController();

            // When
            const result = await controller.getJackpotsForTournament(tournamentId);

            // Then
            expect(result).to.be.empty;
        });

        it('should return jackpots for the tournament', async () => {
            // Given
            const tournamentId = 1;
            const tournament = generateTournament(tournamentId);
            tournament.jackpotTriggers = [
                {
                    jackpotId: 1,
                    threshold: 100,
                    minLevel: 0,
                    final: false,
                    enabled: true
                },
                {
                    jackpotId: 2,
                    threshold: 500,
                    minLevel: 0,
                    final: false,
                    enabled: true
                }
            ];

            const jackpots: Jackpot[] = [{
                id: 1,
                type: JackpotType.Fixed,
                name: 'Jackpot 1',
                label: 'Label 1',
                seed: 100,
                balance: 100,
                splitPayout: true,
                enabled: true,
                balanceUpdateTime: new Date(),
                createTime: new Date(),
                updateTime: new Date()
            },
            {
                id: 2,
                type: JackpotType.Fixed,
                name: 'Jackpot 2',
                label: 'Label 2',
                seed: 300,
                balance: 300,
                splitPayout: true,
                enabled: true,
                balanceUpdateTime: new Date(),
                createTime: new Date(),
                updateTime: new Date()
            }];

            when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);
            when(mockJackpotManager.getMany(1, 2)).thenResolve(jackpots);

            const controller = getController();

            // When
            const result = await controller.getJackpotsForTournament(tournamentId);

            // Then
            expect(result).to.deep.equal(jackpots);
        });
    });

    describe('getEntry()', () => {
        it('should throw a not found error when entry does not exist', async () => {
            // Given
            const tournamentId = 1;

            when(mockTournamentEntryManager.get(tournamentId, userId, true)).thenResolve(undefined);

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
            const delegate = async () => controller.getEntry(tournamentId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Tournament entry not found');
        });

        it('should return the entry when entry exists', async () => {
            // Given
            const tournamentId = 1;

            const entry = generateTournamentEntry(1, userId);
            const entryModel = generateTournamentEntryModel(1, userId);

            when(mockTournamentEntryManager.get(tournamentId, userId, true)).thenResolve(entry);
            when(mockMapper.mapEntry(entry)).thenReturn(entryModel);

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
            const result = await controller.getEntry(tournamentId);

            // Then
            expect(result).to.equal(entryModel);
        });
    });

    describe('join()', () => {
        it('should throw a not found error when the tournament does not exist', async () => {
            // Given
            const tournamentId = 1;

            when(mockTournamentManager.get(tournamentId)).thenResolve(undefined);

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
            const delegate = async () => controller.join(tournamentId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Tournament not found');
        });

        it('should throw a forbidden error when the tournament has ended', async () => {
            // Given
            const tournamentId = 1;

            const tournament = generateTournament(tournamentId);
            tournament.state = TournamentState.Ended;

            when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);

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
            const delegate = async () => controller.join(tournamentId);

            // Then
            await expect(delegate()).to.be.rejectedWith(ForbiddenError, 'Tournament has ended');
        });

        it('should add an entry and return launch info when entry does not exist', async () => {
            // Given
            const tournamentId = 1;
            const launchUrl = 'https://launch-url.com/play';

            const launchInfo: TournamentLaunchInfoModel = {
                tournamentId,
                location: launchUrl,
                type: 'webview'
            };

            const tournament = generateTournament(tournamentId);
            const entry = generateTournamentEntry(1, userId);

            when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);
            when(mockTournamentEntryManager.get(tournamentId, userId, true)).thenResolve(undefined);
            when(mockTournamentEntryManager.add(tournamentId, userId)).thenResolve(entry);
            when(mockLaunchInfoResolver.resolve(tournament, entry, undefined)).thenResolve(launchInfo);

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
            const result = await controller.join(tournamentId);

            // Then
            expect(result).to.exist;
            expect(result).to.equal(launchInfo);
        });

        it('should add an entry and return launch info when entry does not exist and info is supplied', async () => {
            // Given
            const tournamentId = 1;
            const launchUrl = 'https://launch-url.com/play';
            const deviceType = DeviceType.Mobile;
            const info: JoinTournamentModel = {
                deviceType
            };

            const launchInfo: TournamentLaunchInfoModel = {
                tournamentId,
                location: launchUrl,
                type: 'webview'
            };

            const tournament = generateTournament(tournamentId);
            const entry = generateTournamentEntry(1, userId);

            when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);
            when(mockTournamentEntryManager.get(tournamentId, userId, true)).thenResolve(undefined);
            when(mockTournamentEntryManager.add(tournamentId, userId)).thenResolve(entry);
            when(mockLaunchInfoResolver.resolve(tournament, entry, deviceType)).thenResolve(launchInfo);

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
            const result = await controller.join(tournamentId, info);

            // Then
            expect(result).to.exist;
            expect(result).to.equal(launchInfo);
        });

        it('should return launch info when entry already exists', async () => {
            // Given
            const tournamentId = 1;
            const launchUrl = 'https://launch-url.com/play';

            const launchInfo: TournamentLaunchInfoModel = {
                tournamentId,
                location: launchUrl,
                type: 'webview'
            };

            const tournament = generateTournament(tournamentId);
            const entry = generateTournamentEntry(1, userId);

            when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);
            when(mockTournamentEntryManager.get(tournamentId, userId)).thenResolve(entry);
            when(mockLaunchInfoResolver.resolve(tournament, entry, undefined)).thenResolve(launchInfo);

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
            const result = await controller.join(tournamentId);

            // Then
            expect(result).to.exist;
            expect(result).to.equal(launchInfo);
        });

        // TODO: Re-enable once proper spectator mode is available
        it.skip('should throw a forbidden error if entry allocations have all been completed', async () => {
            // Given
            const tournamentId = 1;

            const tournament = generateTournament(tournamentId);
            const entry = generateTournamentEntry(1, userId);
            entry.allocations.forEach(a => a.complete = true);

            when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);
            when(mockTournamentEntryManager.get(tournamentId, userId, true)).thenResolve(entry);

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
            const delegate = async () => controller.join(tournamentId);

            // Then
            await expect(delegate()).to.be.rejectedWith(ForbiddenError, 'No unused allocations remaining');
        });
    });

    /*describe.skip('unjoin()', () => {
        it('should unjoin the tournament', async () => {
            // Given
            const tournamentId = 1;

            when(mockTournamentEntryManager.remove(tournamentId, userId)).thenResolve();

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
            await controller.unjoin(tournamentId);

            // Then
            verify(mockTournamentEntryManager.remove(tournamentId, userId)).once();
        });
    });*/
});