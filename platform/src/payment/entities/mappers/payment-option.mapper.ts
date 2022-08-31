
import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { NewPaymentOption, PaymentOption } from '../../payment-option';
import { PaymentOptionCountryEntity } from '../payment-option-country.entity';
import { PaymentOptionEntity } from '../payment-option.entity';

@Singleton
@LogClass()
export class PaymentOptionEntityMapper {
    public fromEntity(source: PaymentOptionEntity): PaymentOption {
        return {
            id: source.id,
            name: source.name,
            provider: source.provider,
            countries: source.countries.map(c => c.countryCode),
            currencies: source.currencies.map(c => c.code),
            methodTypes: source.methodTypes,
            enabled: source.enabled,
            public: source.public,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public newToEntity(source: NewPaymentOption): PaymentOptionEntity {
        const entity = new PaymentOptionEntity();
        entity.name = source.name;
        entity.provider = source.provider;
        entity.methodTypes = source.methodTypes;
        entity.enabled = source.enabled;
        entity.public = source.public;
        entity.countries = source.countries.map(c => this.toCountryEntity(entity, c));
        return entity;
    }

    public toCountryEntity(paymentOption: PaymentOptionEntity, countryCode: string): PaymentOptionCountryEntity {
        const entity = new PaymentOptionCountryEntity();
        entity.countryCode = countryCode;
        entity.paymentOption = paymentOption;
        return entity;
    }
}