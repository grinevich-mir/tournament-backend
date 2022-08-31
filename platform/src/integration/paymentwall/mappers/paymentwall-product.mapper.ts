import { LogClass } from '../../../core/logging';
import { Singleton } from '../../../core/ioc';
import { PaymentwallProduct } from '../interfaces';
import { Product } from 'paymentwall';

@Singleton
@LogClass()
export class PaymentwallProductMapper {
    public map(source: PaymentwallProduct): Product {
        return new Product(
            source.id,
            source.amount,
            source.currencyCode,
            source.name,
            source.type,
            source.periodLength,
            source.periodType,
            source.recurring,
            source.trialProduct);
    }
}