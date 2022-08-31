import { GlobalDB } from '../../core/db';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { PaymentOptionEntityMapper } from '../entities/mappers';
import { PaymentOptionCountryEntity } from '../entities/payment-option-country.entity';
import { PaymentOptionEntity } from '../entities/payment-option.entity';
import { NewPaymentOption, PaymentOption, PaymentOptionUpdate } from '../payment-option';

@Singleton
@LogClass()
export class PaymentOptionRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly mapper: PaymentOptionEntityMapper) {
    }

    public async getAll(): Promise<PaymentOption[]> {
        const connection = await this.db.getConnection();
        const entities = await connection.manager.find(PaymentOptionEntity, {
            relations: ['currencies', 'countries']
        });
        return entities.map(e => this.mapper.fromEntity(e));
    }

    public async get(id: number): Promise<PaymentOption | undefined> {
        const entity = await this.find(id);

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async add(option: NewPaymentOption): Promise<PaymentOption> {
        const connection = await this.db.getConnection();
        const entity = this.mapper.newToEntity(option);
        const saved = await connection.manager.save(entity);

        await connection
            .createQueryBuilder()
            .relation(PaymentOptionEntity, 'currencies')
            .of(saved.id)
            .addAndRemove(option.currencies, entity.currencies);

        return await this.get(saved.id) as PaymentOption;
    }

    public async update(id: number, update: PaymentOptionUpdate): Promise<PaymentOption> {
        const connection = await this.db.getConnection();
        await connection.manager.update(PaymentOptionEntity, id,
            {
                name: update.name,
                methodTypes: update.methodTypes,
                enabled: update.enabled,
                public: update.public
            });

        await this.setCountries(id, update.countries);
        await this.setCurrencies(id, update.currencies);

        return await this.get(id) as PaymentOption;
    }

    public async remove(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.transaction(async manager => {
            await manager.delete(PaymentOptionCountryEntity, { paymentOptionId: id });
            await manager.delete(PaymentOptionEntity, id);
        });
    }

    private async setCurrencies(id: number, currencyCodes: string[]): Promise<void> {
        const connection = await this.db.getConnection();
        const entity = await this.find(id);

        if (!entity)
            return;

        await connection
            .createQueryBuilder()
            .relation(PaymentOptionEntity, 'currencies')
            .of(id)
            .addAndRemove(currencyCodes, entity.currencies);
    }

    private async setCountries(id: number, countryCodes: string[]): Promise<void> {
        const connection = await this.db.getConnection();
        const entity = await this.find(id);

        if (!entity)
            return;

        await connection.transaction(async manager => {
            await manager.delete(PaymentOptionCountryEntity, {
                paymentOptionId: id
            });
            const entities = countryCodes.map(c => this.mapper.toCountryEntity(entity, c));
            await manager.save(entities);
        });
    }

    private async find(id: number): Promise<PaymentOptionEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(PaymentOptionEntity, id, {
            relations: ['currencies', 'countries']
        });
    }
}