import { Singleton, Inject } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { CurrencyEntity, CurrencyRateEntity } from '../entities';
import _ from 'lodash';
import { FindManyOptions, FindConditions } from 'typeorm';
import { CurrencyFilter } from '../currency-filter';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class CurrencyRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getAll(filter?: CurrencyFilter): Promise<CurrencyEntity[]> {
        const connection = await this.db.getConnection();
        const where: FindConditions<CurrencyEntity> = {};
        const options: FindManyOptions<CurrencyEntity> = { where };

        if (filter) {
            if (filter.enabled)
                where.enabled = filter.enabled;

            if (filter.userSelectable)
                where.userSelectable = filter.userSelectable;
        }

        return connection.manager.find(CurrencyEntity, options);
    }

    public async add(code: string, rate: number): Promise<CurrencyEntity> {
        const connection = await this.db.getConnection();
        const currency = connection.manager.create(CurrencyEntity, { code });

        return connection.transaction(async manager => {
            await manager.insert(CurrencyEntity, currency);
            await manager.insert(CurrencyRateEntity, { currencyCode: code, rate  });
            return currency;
        });
    }

    public async getRates(): Promise<CurrencyRateEntity[]> {
        const connection = await this.db.getConnection();
        return connection.manager.find(CurrencyRateEntity);
    }

    public async setRate(code: string, rate: number): Promise<void> {
        const connection = await this.db.getConnection();

        await connection.manager.update(CurrencyRateEntity, code, {
            rate,
            updateTime: () => 'CURRENT_TIMESTAMP'
        });
    }
}
