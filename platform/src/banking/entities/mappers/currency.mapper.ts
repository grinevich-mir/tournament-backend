import { Singleton } from '../../../core/ioc';
import { CurrencyEntity } from '../currency.entity';
import { Currency } from '../../currency';
import { CurrencyRateEntity } from '../currency-rate.entity';
import { CurrencyRate } from '../../currency-rate';

@Singleton
export class CurrencyEntityMapper {
    public fromEntity(source: CurrencyEntity): Currency {
        return {
            code: source.code,
            userSelectable: source.userSelectable,
            enabled: source.enabled
        };
    }

    public rateFromEntity(source: CurrencyRateEntity): CurrencyRate {
        return {
            currencyCode: source.currencyCode,
            rate: source.rate,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}