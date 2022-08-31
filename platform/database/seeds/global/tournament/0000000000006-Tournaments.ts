import { MigrationInterface, QueryRunner, In } from 'typeorm';
import { TournamentTemplateEntity, TournamentTemplateGameAssignmentEntity } from '../../../../src/tournament/entities';
import { TournamentGameSelectionType } from '../../../../src/tournament/tournament-game-selection-type';
import * as env from 'env-var';
import { PrizeType } from '../../../../src/prize/prize-type';
import { TournamentTemplateCashPrizeEntity } from '../../../../src/tournament/entities/tournament-template-prize.entity';
import { plainToClass } from 'class-transformer';
import { TournamentLeaderboardMode } from '../../../../src/tournament/tournament-leaderboard-mode';
import { GameMetadata } from '../../../../src/game/game-metadata';
import { TournamentLeaderboardPointMode } from '../../../../src/tournament/tournament-leaderboard-point-mode';
import { TournamentType } from '../../../../src/tournament/tournament-type';

const brand = env.get('BRAND').required().asString();
const stage = env.get('STAGE').required().asString();

const DEFAULT_REGION = 'us-east-1';

const tournamentTemplates = [
    {
        id: 1,
        name: 'Hi-Lo Leaderboard',
        description: 'Top 3 Win Cash Prizes',
        typeId: TournamentType.HiLo,
        skins: [{ id: 'tournament' }],
        bannerImgUrl: `https://content.${brand}.${stage}.tgaming.io/banners/hilo1.jpg`,
        minPlayers: 0,
        maxPlayers: 5000,
        autoPayout: true,
        public: true,
        nameColour: '#002544',
        gameColour: '#008cff',
        currencyCode: 'USD',
        durationMins: 15,
        entryCutOff: 120,
        prizeTotal: 600,
        cronPattern: '*/15 * * * *',
        allowJoinAfterStart: true,
        leaderboardMode: TournamentLeaderboardMode.Visible,
        leaderboardPointMode: TournamentLeaderboardPointMode.Highest,
        allowedPowerups: [],
        region: DEFAULT_REGION,
        chatEnabled: true,
        minLevel: 0,
        gameSelectionType: TournamentGameSelectionType.Sequential,
        gameAssignments: [{
            position: 1,
            gameId: 2
        }],
        enabled: true,
        prizes: [
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 1,
                endRank: 1,
                type: PrizeType.Cash,
                amount: 300,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 2,
                endRank: 2,
                type: PrizeType.Cash,
                amount: 200,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 3,
                endRank: 3,
                type: PrizeType.Cash,
                amount: 100,
                currencyCode: 'USD'
            })
        ]
    },
    {
        id: 2,
        name: 'Hi-Lo Last Man Standing',
        description: 'Last one left wins!',
        typeId: TournamentType.HiLo,
        skins: [{ id: 'tournament' }],
        bannerImgUrl: `https://content.${brand}.${stage}.tgaming.io/banners/hilo1.jpg`,
        minPlayers: 1,
        maxPlayers: 5000,
        autoPayout: false,
        public: true,
        durationMins: undefined,
        nameColour: '#FF5733',
        gameColour: '#33FF33',
        currencyCode: 'USD',
        prizeTotal: 500,
        cronPattern: '*/5 * * * *',
        allowJoinAfterStart: false,
        region: DEFAULT_REGION,
        chatEnabled: true,
        minLevel: 0,
        allowedPowerups: [],
        gameSelectionType: TournamentGameSelectionType.Sequential,
        gameAssignments: [{
            position: 1,
            gameId: 1
        }],
        enabled: true,
        prizes: [
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 1,
                endRank: 1,
                type: PrizeType.Cash,
                amount: 500,
                currencyCode: 'USD'
            })
        ]
    },
    {
        id: 3,
        name: 'HiLo Survivalist',
        description: '10 Round Survival',
        typeId: TournamentType.HiLo,
        skins: [{ id: 'tournament' }],
        bannerImgUrl: `https://content.${brand}.${stage}.tgaming.io/banners/hilo2.jpg`,
        minPlayers: 1,
        maxPlayers: 2500,
        autoPayout: false,
        public: true,
        durationMins: undefined,
        nameColour: '#000000',
        gameColour: '#FFCC00',
        currencyCode: 'USD',
        prizeTotal: 100,
        cronPattern: '*/5 * * * *',
        allowJoinAfterStart: false,
        region: DEFAULT_REGION,
        chatEnabled: true,
        minLevel: 0,
        gameSelectionType: TournamentGameSelectionType.Sequential,
        allowedPowerups: [],
        gameAssignments: [{
            position: 1,
            gameId: 1,
            metadataOverride: { 
                maxRounds: 10
            } as GameMetadata
        }],
        enabled: true,
        prizes: [
            plainToClass(TournamentTemplateCashPrizeEntity, 
            {
                startRank: 1,
                endRank: 1,
                type: PrizeType.Cash,
                amount: 100,
                currencyCode: 'USD'
            })
        ]
    },
    {
        id: 4,
        name: 'Hi-Lo Last 5 Win',
        description: 'Last 5 players or less win a share',
        typeId: TournamentType.HiLo,
        skins: [{ id: 'tournament' }],
        bannerImgUrl: `https://content.${brand}.${stage}.tgaming.io/banners/hilo1.jpg`,
        minPlayers: 1,
        maxPlayers: 2500,
        autoPayout: false,
        public: true,
        durationMins: undefined,
        nameColour: '#000000',
        gameColour: '#FFCC00',
        currencyCode: 'USD',
        prizeTotal: 100,
        cronPattern: '1-59/3 * * * *',
        allowJoinAfterStart: false,
        region: DEFAULT_REGION,
        chatEnabled: true,
        minLevel: 0,
        gameSelectionType: TournamentGameSelectionType.Sequential,
        gameAssignments: [{
            position: 1,
            gameId: 1,
            metadataOverride: { 
                maxWinners: 5
            } as GameMetadata
        }],
        allowedPowerups: [],
        enabled: true,
        prizes: [
            plainToClass(TournamentTemplateCashPrizeEntity, 
            {
                startRank: 1,
                endRank: 1,
                type: PrizeType.Cash,
                amount: 100,
                currencyCode: 'USD'
            })
        ]
    },
    {
        id: 5,
        name: 'Astro Spins',
        description: 'Spin the mystical wheel!',
        typeId: TournamentType.HiLo,
        skins: [{ id: 'tournament' }],
        bannerImgUrl: `https://content.${brand}.${stage}.tgaming.io/banners/astro-hilo.png`,
        minPlayers: 0,
        maxPlayers: 5000,
        autoPayout: true,
        public: true,
        nameColour: '#ffffff',
        gameColour: '#6550C8',
        currencyCode: 'USD',
        durationMins: 30,
        entryCutOff: 10,
        prizeTotal: 600,
        cronPattern: '*/15 * * * *',
        allowJoinAfterStart: true,
        leaderboardMode: TournamentLeaderboardMode.Visible,
        leaderboardPointMode: TournamentLeaderboardPointMode.Highest,
        allowedPowerups: [],
        region: DEFAULT_REGION,
        chatEnabled: true,
        minLevel: 0,
        gameSelectionType: TournamentGameSelectionType.Sequential,
        gameAssignments: [{
            position: 1,
            gameId: 3
        }],
        enabled: true,
        prizes: [
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 1,
                endRank: 1,
                type: PrizeType.Cash,
                amount: 300,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 2,
                endRank: 2,
                type: PrizeType.Cash,
                amount: 200,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 3,
                endRank: 3,
                type: PrizeType.Cash,
                amount: 100,
                currencyCode: 'USD'
            })
        ]
    },
    {
        id: 6,
        name: '90 Ball',
        description: '90 Ball',
        typeId: TournamentType.Bingo,
        skins: [{ id: 'tournament' }],
        bannerImgUrl: `https://content.${brand}.${stage}.tgaming.io/banners/bingo3.jpg`,
        minPlayers: 1,
        maxPlayers: 10000,
        autoPayout: false,
        public: true,
        nameColour: '#FFFFFF',
        gameColour: '#FF0000',
        currencyCode: 'USD',
        prizeTotal: 500,
        cronPattern: '*/5 * * * *',
        allowJoinAfterStart: false,
        allowedPowerups: [],
        region: DEFAULT_REGION,
        chatEnabled: true,
        minLevel: 0,
        gameSelectionType: TournamentGameSelectionType.Sequential,
        gameAssignments: [{
            position: 1,
            gameId: 4
        }],
        enabled: true,
        prizes: [
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 1,
                endRank: 1,
                type: PrizeType.Cash,
                amount: 250,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 2,
                endRank: 2,
                type: PrizeType.Cash,
                amount: 150,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 3,
                endRank: 3,
                type: PrizeType.Cash,
                amount: 100,
                currencyCode: 'USD'
            })
        ]
    },
    {
        id: 7,
        name: 'Bingo Brigade',
        description: '90 Ball Bingo',
        typeId: TournamentType.Bingo,
        skins: [{ id: 'tournament' }],
        bannerImgUrl: `https://content.${brand}.${stage}.tgaming.io/banners/bingo1.jpg`,
        minPlayers: 1,
        maxPlayers: 10000,
        autoPayout: false,
        public: true,
        nameColour: '#FFFFFF',
        gameColour: '#FF0000',
        currencyCode: 'USD',
        prizeTotal: 500,
        cronPattern: '*/5 * * * *',
        allowJoinAfterStart: false,
        allowedPowerups: [],
        region: DEFAULT_REGION,
        chatEnabled: true,
        minLevel: 0,
        gameSelectionType: TournamentGameSelectionType.Sequential,
        gameAssignments: [{
            position: 1,
            gameId: 5
        }],
        enabled: true,
        prizes: [
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 1,
                endRank: 1,
                type: PrizeType.Cash,
                amount: 250,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 2,
                endRank: 2,
                type: PrizeType.Cash,
                amount: 150,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 3,
                endRank: 3,
                type: PrizeType.Cash,
                amount: 100,
                currencyCode: 'USD'
            })
        ]
    },
    {
        id: 8,
        name: 'Wishes',
        description: 'Wishes',
        typeId: TournamentType.Slot,
        skins: [{ id: 'tournament' }],
        bannerImgUrl: `https://content.${brand}.${stage}.tgaming.io/banners/wishes.png`,
        minPlayers: 1,
        maxPlayers: 1000,
        autoPayout: true,
        public: true,
        nameColour: '#FFFFFF',
        gameColour: '#399639',
        currencyCode: 'USD',
        durationMins: 15,
        prizeTotal: 600,
        cronPattern: '*/15 * * * *',
        entryAllocationCredit: 500,
        leaderboardMode: TournamentLeaderboardMode.Visible,
        leaderboardPointConfig: {
            RoundWin: {
                resetCounts: ['RoundLose'],
                rules: [
                    {
                        description: 'Winnings = points',
                        points: 'input'
                    },
                    {
                        description: '2x Consecutive Win = 2x Winnings',
                        points: 'input',
                        count: 2,
                        multiplier: 2
                    },
                    {
                        description: '4x Consecutive Win = 4x Winnings',
                        points: 'input',
                        count: 4,
                        multiplier: 4
                    }
                ]
            },
            RoundLose: {
                resetCounts: ['RoundWin'],
                rules: [
                    {
                        description: 'Loss = 10pts',
                        points: 10
                    },
                    {
                        description: '5x Consecutive Losses = 100pts',
                        points: 100,
                        count: 5
                    },
                    {
                        description: '10x Consecutive Losses = 1000pts',
                        points: 1000,
                        count: 10
                    }
                ]
            }
        },
        allowJoinAfterStart: true,
        allowedPowerups: [],
        region: DEFAULT_REGION,
        chatEnabled: true,
        minLevel: 0,
        gameSelectionType: TournamentGameSelectionType.Sequential,
        gameAssignments: [
            {
                position: 1,
                gameId: 8
            }
        ],
        enabled: true,
        prizes: [
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 1,
                endRank: 1,
                type: PrizeType.Cash,
                amount: 300,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 2,
                endRank: 2,
                type: PrizeType.Cash,
                amount: 200,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 3,
                endRank: 3,
                type: PrizeType.Cash,
                amount: 100,
                currencyCode: 'USD'
            })
        ]
    },
    {
        id: 9,
        name: 'Robin Hood',
        description: 'Robin Hood',
        typeId: TournamentType.Slot,
        skins: [{ id: 'tournament' }],
        bannerImgUrl: `https://content.${brand}.${stage}.tgaming.io/banners/robinhood.png`,
        minPlayers: 1,
        maxPlayers: 1000,
        autoPayout: true,
        public: true,
        nameColour: '#FFFFFF',
        gameColour: '#399639',
        currencyCode: 'USD',
        durationMins: 15,
        prizeTotal: 600,
        cronPattern: '*/15 * * * *',
        entryAllocationCredit: 500,
        leaderboardMode: TournamentLeaderboardMode.Visible,
        leaderboardPointConfig: {
            RoundWin: {
                resetCounts: ['RoundLose'],
                rules: [
                    {
                        description: 'Winnings = points',
                        points: 'input'
                    },
                    {
                        description: '2x Consecutive Win = 2x Winnings',
                        points: 'input',
                        count: 2,
                        multiplier: 2
                    },
                    {
                        description: '4x Consecutive Win = 4x Winnings',
                        points: 'input',
                        count: 4,
                        multiplier: 4
                    }
                ]
            },
            RoundLose: {
                resetCounts: ['RoundWin'],
                rules: [
                    {
                        description: 'Loss = 10pts',
                        points: 10
                    },
                    {
                        description: '5x Consecutive Losses = 100pts',
                        points: 100,
                        count: 5
                    },
                    {
                        description: '10x Consecutive Losses = 1000pts',
                        points: 1000,
                        count: 10
                    }
                ]
            }
        },
        allowJoinAfterStart: true,
        allowedPowerups: [],
        region: DEFAULT_REGION,
        chatEnabled: true,
        minLevel: 0,
        gameSelectionType: TournamentGameSelectionType.Sequential,
        gameAssignments: [
            {
                position: 1,
                gameId: 6
            }
        ],
        enabled: true,
        prizes: [
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 1,
                endRank: 1,
                type: PrizeType.Cash,
                amount: 300,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 2,
                endRank: 2,
                type: PrizeType.Cash,
                amount: 200,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 3,
                endRank: 3,
                type: PrizeType.Cash,
                amount: 100,
                currencyCode: 'USD'
            })
        ]
    },
    {
        id: 10,
        name: 'The Big Deal',
        description: 'The Big Deal',
        typeId: TournamentType.Slot,
        skins: [{ id: 'tournament' }],
        bannerImgUrl: `https://content.${brand}.${stage}.tgaming.io/banners/bigdeal.png`,
        minPlayers: 1,
        maxPlayers: 1000,
        autoPayout: true,
        public: true,
        nameColour: '#FFFFFF',
        gameColour: '#399639',
        currencyCode: 'USD',
        durationMins: 15,
        prizeTotal: 600,
        cronPattern: '*/15 * * * *',
        entryAllocationCredit: 500,
        leaderboardMode: TournamentLeaderboardMode.Visible,
        leaderboardPointConfig: {
            RoundWin: {
                resetCounts: ['RoundLose'],
                rules: [
                    {
                        description: 'Winnings = points',
                        points: 'input'
                    },
                    {
                        description: '2x Consecutive Win = 2x Winnings',
                        points: 'input',
                        count: 2,
                        multiplier: 2
                    },
                    {
                        description: '4x Consecutive Win = 4x Winnings',
                        points: 'input',
                        count: 4,
                        multiplier: 4
                    }
                ]
            },
            RoundLose: {
                resetCounts: ['RoundWin'],
                rules: [
                    {
                        description: 'Loss = 10pts',
                        points: 10
                    },
                    {
                        description: '5x Consecutive Losses = 100pts',
                        points: 100,
                        count: 5
                    },
                    {
                        description: '10x Consecutive Losses = 1000pts',
                        points: 1000,
                        count: 10
                    }
                ]
            }
        },
        allowJoinAfterStart: true,
        allowedPowerups: [],
        region: DEFAULT_REGION,
        chatEnabled: true,
        minLevel: 0,
        gameSelectionType: TournamentGameSelectionType.Sequential,
        gameAssignments: [
            {
                position: 1,
                gameId: 7
            }
        ],
        enabled: true,
        prizes: [
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 1,
                endRank: 1,
                type: PrizeType.Cash,
                amount: 300,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 2,
                endRank: 2,
                type: PrizeType.Cash,
                amount: 200,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 3,
                endRank: 3,
                type: PrizeType.Cash,
                amount: 100,
                currencyCode: 'USD'
            })
        ]
    },
    {
        id: 11,
        name: 'Legend of Hydra™',
        description: 'Can you take on the Hydra?',
        typeId: TournamentType.Slot,
        skins: [{ id: 'tournament' }],
        bannerImgUrl: `https://content.${brand}.${stage}.tgaming.io/banners/hydra.jpg`,
        minPlayers: 1,
        maxPlayers: 1000,
        autoPayout: true,
        public: true,
        nameColour: '#FFFFFF',
        gameColour: '#399639',
        currencyCode: 'USD',
        durationMins: 15,
        prizeTotal: 600,
        cronPattern: '*/15 * * * *',
        entryAllocationCredit: 500,
        leaderboardMode: TournamentLeaderboardMode.Visible,
        leaderboardPointConfig: {
            RoundWin: {
                resetCounts: ['RoundLose'],
                rules: [
                    {
                        description: 'Winnings = points',
                        points: 'input'
                    },
                    {
                        description: '2x Consecutive Win = 2x Winnings',
                        points: 'input',
                        count: 2,
                        multiplier: 2
                    },
                    {
                        description: '4x Consecutive Win = 4x Winnings',
                        points: 'input',
                        count: 4,
                        multiplier: 4
                    }
                ]
            },
            RoundLose: {
                resetCounts: ['RoundWin'],
                rules: [
                    {
                        description: 'Loss = 10pts',
                        points: 10
                    },
                    {
                        description: '5x Consecutive Losses = 100pts',
                        points: 100,
                        count: 5
                    },
                    {
                        description: '10x Consecutive Losses = 1000pts',
                        points: 1000,
                        count: 10
                    }
                ]
            }
        },
        allowJoinAfterStart: true,
        allowedPowerups: [],
        region: DEFAULT_REGION,
        chatEnabled: true,
        minLevel: 0,
        gameSelectionType: TournamentGameSelectionType.Sequential,
        gameAssignments: [
            {
                position: 1,
                gameId: 9
            }
        ],
        enabled: true,
        prizes: [
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 1,
                endRank: 1,
                type: PrizeType.Cash,
                amount: 300,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 2,
                endRank: 2,
                type: PrizeType.Cash,
                amount: 200,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 3,
                endRank: 3,
                type: PrizeType.Cash,
                amount: 100,
                currencyCode: 'USD'
            })
        ]
    },
    {
        id: 12,
        name: '21',
        description: '21',
        typeId: TournamentType.Blackjack,
        skins: [{ id: 'tournament' }],
        bannerImgUrl: `https://content.${brand}.${stage}.tgaming.io/banners/21.png`,
        minPlayers: 0,
        maxPlayers: 5000,
        autoPayout: true,
        public: true,
        nameColour: '#002544',
        gameColour: '#008cff',
        currencyCode: 'USD',
        durationMins: 15,
        entryCutOff: 120,
        prizeTotal: 600,
        cronPattern: '*/15 * * * *',
        allowJoinAfterStart: true,
        leaderboardMode: TournamentLeaderboardMode.Visible,
        leaderboardPointMode: TournamentLeaderboardPointMode.Highest,
        allowedPowerups: [],
        region: DEFAULT_REGION,
        chatEnabled: true,
        minLevel: 0,
        gameSelectionType: TournamentGameSelectionType.Sequential,
        gameAssignments: [{
            position: 1,
            gameId: 10
        }],
        enabled: true,
        prizes: [
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 1,
                endRank: 1,
                type: PrizeType.Cash,
                amount: 300,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 2,
                endRank: 2,
                type: PrizeType.Cash,
                amount: 200,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 3,
                endRank: 3,
                type: PrizeType.Cash,
                amount: 100,
                currencyCode: 'USD'
            })
        ]
    },
    {
        id: 13,
        name: 'Crash',
        description: 'Crash',
        typeId: TournamentType.Crash,
        skins: [{ id: 'tournament' }],
        bannerImgUrl: `https://content.${brand}.${stage}.tgaming.io/banners/crash1.png`,
        minPlayers: 0,
        maxPlayers: 5000,
        autoPayout: true,
        public: true,
        nameColour: '#002544',
        gameColour: '#008cff',
        currencyCode: 'USD',
        durationMins: 30,
        entryCutOff: 120,
        prizeTotal: 600,
        cronPattern: '*/30 * * * *',
        allowJoinAfterStart: true,
        leaderboardMode: TournamentLeaderboardMode.Visible,
        leaderboardPointMode: TournamentLeaderboardPointMode.Highest,
        allowedPowerups: [],
        region: DEFAULT_REGION,
        chatEnabled: true,
        minLevel: 0,
        gameSelectionType: TournamentGameSelectionType.Sequential,
        gameAssignments: [{
            position: 1,
            gameId: 11
        }],
        enabled: true,
        prizes: [
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 1,
                endRank: 1,
                type: PrizeType.Cash,
                amount: 300,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 2,
                endRank: 2,
                type: PrizeType.Cash,
                amount: 200,
                currencyCode: 'USD'
            }),
            plainToClass(TournamentTemplateCashPrizeEntity,
            {
                startRank: 3,
                endRank: 3,
                type: PrizeType.Cash,
                amount: 100,
                currencyCode: 'USD'
            })
        ]
    }
];

export class Tournaments0000000000006 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        for (const template of tournamentTemplates) {
            const entity = new TournamentTemplateEntity();
            Object.assign(entity, template);
            await queryRunner.manager.save(entity);

            for (const assignment of template.gameAssignments) {
                const assignmentEntity = queryRunner.manager.create(TournamentTemplateGameAssignmentEntity, assignment);
                assignmentEntity.templateId = template.id;
                await queryRunner.manager.save(assignmentEntity);
            }

            for (const prize of template.prizes) {
                prize.templateId = template.id;
                await queryRunner.manager.save(prize);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.connection.createQueryBuilder(queryRunner)
            .delete()
            .from(TournamentTemplateEntity)
            .where({ id: In(tournamentTemplates.map(b => b.id)) })
            .execute();
    }
}
