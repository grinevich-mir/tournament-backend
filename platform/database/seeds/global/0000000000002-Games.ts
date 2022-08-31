import { MigrationInterface, QueryRunner, In } from 'typeorm';
import { GameProviderEntity, GameTypeEntity, GameEntity } from '../../../src/game/entities';
import { GameProvider } from '../../../src/game/game-provider';
import { GameType } from '../../../src/game/game-type';
import * as env from 'env-var';

const stage = env.get('STAGE').required().asString();
const brand = env.get('BRAND').required().asString();

const gameProviders: Partial<GameProviderEntity>[] = [
    {
        id: GameProvider.Hilo,
        name: GameProvider[GameProvider.Hilo]
    },
    {
        id: GameProvider.Tambola,
        name: GameProvider[GameProvider.Tambola]
    },
    {
        id: GameProvider.Revolver,
        name: GameProvider[GameProvider.Revolver]
    },
    {
        id: GameProvider.Playtech,
        name: GameProvider[GameProvider.Playtech]
    }, 
    {
        id: GameProvider.Blackjack,
        name: GameProvider[GameProvider.Blackjack]
    },
    {
        id: GameProvider.Crash,
        name: GameProvider[GameProvider.Crash]
    }
];

const gameTypes: Partial<GameTypeEntity>[] = [
    {
        id: GameType.Slot,
        name: GameType[GameType.Slot]
    },
    {
        id: GameType.Hilo,
        name: GameType[GameType.Hilo]
    },
    {
        id: GameType.Bingo,
        name: GameType[GameType.Bingo]
    },
    {
        id: GameType.Blackjack,
        name: GameType[GameType.Blackjack]
    },
    {
        id: GameType.Crash,
        name: GameType[GameType.Crash]
    }
];


const games: Partial<GameEntity>[] = [
    {
        id: 1,
        name: 'Hi-Lo',
        typeId: GameType.Hilo,
        providerId: GameProvider.Hilo,
        thumbnail: `https://content.${brand}.${stage}.tgaming.io/banners/hilo1.jpg`,
        metadata: {
            externalControlSupport: true
        }
    },
    {
        id: 2,
        name: 'Hi-Lo Leaderboard',
        typeId: GameType.Hilo,
        providerId: GameProvider.Hilo,
        thumbnail: `https://content.${brand}.${stage}.tgaming.io/banners/hilo2.jpg`,
        metadata: {
            mode: 1,
            externalControlSupport: true
        }
    },
    {
        id: 3,
        name: 'Astro Roulette',
        typeId: GameType.Hilo,
        providerId: GameProvider.Hilo,
        thumbnail: `https://content.${brand}.${stage}.tgaming.io/banners/astro-hilo.png`,
        metadata: {
            mode: 3,
            gameLocation: `hiloastro1.${stage}.hilo.tgaming.io`,
            externalControlSupport: true
        }
    },
    {
        id: 4,
        name: '90 Ball',
        typeId: GameType.Bingo,
        providerId: GameProvider.Tambola,
        thumbnail: `https://content.${brand}.${stage}.tgaming.io/banners/bingo3.jpg`,
        metadata: {
            balls: 90,
            externalControlSupport: true
        }
    },
    {
        id: 5,
        name: 'Bingo Brigade',
        typeId: GameType.Bingo,
        providerId: GameProvider.Tambola,
        thumbnail: `https://content.${brand}.${stage}.tgaming.io/banners/bingo1.jpg`,
        metadata: {
            balls: 90,
            externalControlSupport: true,
            gameLocation: `bingobrigade1.${stage}.bingo.tgaming.io`,
        }
    },
    {
        id: 6,
        name: 'Robin Hood',
        typeId: GameType.Slot,
        providerId: GameProvider.Revolver,
        providerRef: '63adf756b84911e896f8529269fb1459',
        thumbnail: `https://content.${brand}.${stage}.tgaming.io/banners/rh.jpg`,
        metadata: {
            ways: 243,
            reelsWidth: 5,
            reelsHeight: 3,
            externalControlSupport: true
        }
    },
    {
        id: 7,
        name: 'The Big Deal',
        typeId: GameType.Slot,
        providerId: GameProvider.Revolver,
        providerRef: '63adee50b84911e896f8529269fb1459',
        thumbnail: `https://content.${brand}.${stage}.tgaming.io/banners/bd.jpg`,
        metadata: {
            lines: 20,
            reelsWidth: 5,
            reelsHeight: 3,
            externalControlSupport: true
        }
    },
    {
        id: 8,
        name: 'Wishes',
        typeId: GameType.Slot,
        providerId: GameProvider.Revolver,
        providerRef: '63adf54eb84911e896f8529269fb1459',
        thumbnail: `https://content.${brand}.${stage}.tgaming.io/banners/ws.jpg`,
        metadata: {
            lines: 9,
            reelsWidth: 3,
            reelsHeight: 3,
            externalControlSupport: true
        }
    },
    {
        id: 9,
        name: 'Legend of Hydra™',
        typeId: GameType.Slot,
        providerId: GameProvider.Playtech,
        providerRef: 'gpas_hydra_pop',
        thumbnail: `https://content.${brand}.${stage}.tgaming.io/banners/hydra.jpg`
    },
    {
        id: 10,
        name: '21',
        typeId: GameType.Blackjack,
        providerId: GameProvider.Blackjack,
        thumbnail: `https://content.${brand}.${stage}.tgaming.io/banners/21.jpg`,
        metadata: {
            externalControlSupport: true
        }
    },
    {
        id: 11,
        name: 'Crash',
        typeId: GameType.Crash,
        providerId: GameProvider.Crash,
        thumbnail: `https://content.${brand}.${stage}.tgaming.io/banners/crash1.png`,
        metadata: {
            externalControlSupport: true
        }
    }
];

export class Games0000000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.manager.save(gameProviders.map(provider => {
            const entity = new GameProviderEntity();
            Object.assign(entity, provider);
            return entity;
        }));

        await queryRunner.manager.save(gameTypes.map(gameType => {
            const entity = new GameTypeEntity();
            Object.assign(entity, gameType);
            return entity;
        }));

        await queryRunner.manager.save(games.map(game => {
            const entity = new GameEntity();
            Object.assign(entity, game);
            return entity;
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.connection.createQueryBuilder(queryRunner)
            .delete()
            .from(GameTypeEntity)
            .where({ id: In(gameTypes.map(b => b.id)) })
            .execute();

        await queryRunner.connection.createQueryBuilder(queryRunner)
            .delete()
            .from(GameProviderEntity)
            .where({ id: In(gameProviders.map(b => b.id)) })
            .execute();

        await queryRunner.connection.createQueryBuilder(queryRunner)
            .delete()
            .from(GameEntity)
            .where({ id: In(games.map(b => b.id)) })
            .execute();
    }
}