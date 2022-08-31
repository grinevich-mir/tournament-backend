import { FindConditions, FindOneOptions } from 'typeorm';
import { GlobalDB } from '../../core/db';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { GameBonusEntity } from '../entities';
import { GameBonusEntityMapper } from '../entities/mappers';
import { GameBonus } from '../game-bonus';
import { NewGameBonus } from '../new-game-bonus';

@Singleton
@LogClass()
export class GameBonusRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly mapper: GameBonusEntityMapper) {
        }

    public async get(userId: number, gameId: number): Promise<GameBonus[]> {
        const connection = await this.db.getConnection();
        const where: FindConditions<GameBonusEntity> = {
            userId,
            gameId
        };

        const options: FindOneOptions<GameBonusEntity> = {
            where
        };

        const entities = await connection.manager.find(GameBonusEntity, options);
        return entities.map(e => this.mapper.fromEntity(e));
    }

    public async add(bonus: NewGameBonus): Promise<void> {
        const connection = await this.db.getConnection();

        const exists = await connection.manager.count(GameBonusEntity, {
            where: {
                gameId: bonus.gameId,
                providerId: bonus.provider,
                providerRef: bonus.providerRef
            }
         }) > 0;

        if (exists)
            return;

        const entity = this.mapper.newToEntity(bonus);
        await connection.manager.save(entity);
    }

    public async remove(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.delete(GameBonusEntity, id);
    }
}