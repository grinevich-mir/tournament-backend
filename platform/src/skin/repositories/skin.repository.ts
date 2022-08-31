import { Singleton, Inject } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { SkinEntity } from '../entities';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class SkinRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
        }

    public async getAll(): Promise<SkinEntity[]> {
        const connection = await this.db.getConnection();
        return connection.manager.find(SkinEntity);
    }

    public async get(id: string): Promise<SkinEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(SkinEntity, id);
    }

    public async getByUserPoolId(userPoolId: string): Promise<SkinEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(SkinEntity, { where: { userPoolId } });
    }
}