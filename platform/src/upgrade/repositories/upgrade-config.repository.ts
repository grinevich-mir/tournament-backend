import { Singleton, Inject } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { UpgradeConfigEntity, UpgradeLevelConfigEntity } from '../entities';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class UpgradeConfigRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
        }

    public async getAll(): Promise<UpgradeConfigEntity[]> {
        const connection = await this.db.getConnection();
        return connection.manager.find(UpgradeConfigEntity);
    }

    public async get(skinId: string): Promise<UpgradeConfigEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(UpgradeConfigEntity, skinId);
    }

    public async getAllLevel(skinId: string): Promise<UpgradeLevelConfigEntity[]> {
        const connection = await this.db.getConnection();
        return connection.manager.find(UpgradeLevelConfigEntity, {
            where: {
                skinId
            }
         });
    }
}