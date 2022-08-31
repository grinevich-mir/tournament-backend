import { IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { PingbackProcessor } from './pingback-processor';
import { PaymentwallPingbackType } from '@tcom/platform/lib/integration/paymentwall';
import { OrderProcessor, RefundProcessor } from './processors';

@Singleton
@LogClass({ result: false })
export class PingbackProcessorFactory {
    public create(type: PaymentwallPingbackType): PingbackProcessor {
        switch (type) {
            case PaymentwallPingbackType.Regular:
                return IocContainer.get(OrderProcessor);

            case PaymentwallPingbackType.Negative:
                return IocContainer.get(RefundProcessor);

            default:
                throw new Error(`Paymentwall pingback type '${type}' not supported.`);
        }
    }
}