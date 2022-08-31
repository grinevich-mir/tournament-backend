import { IocContainer, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { OrderItemType } from '../order-item-type';
import { DiamondOrderItemProcessor } from './diamond-order-item.processor';
import { OrderItemProcessor } from './order-item-processor';

@Singleton
@LogClass()
export class OrderItemProcessorFactory {
    public create(type: OrderItemType): OrderItemProcessor {
        switch (type) {
            case OrderItemType.Diamonds:
                return IocContainer.get(DiamondOrderItemProcessor);
        }
    }
}