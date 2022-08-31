import { IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { SkrillTransactionStatus } from '@tcom/platform/lib/integration/skrill';
import { NotificationProcessor } from './notification-processor';
import { OrderNotificationProcessor } from './processors';

@Singleton
@LogClass({ result: false })
export class NotificationProcessorFactory {
    public create(status: SkrillTransactionStatus): NotificationProcessor {
        switch (status) {
            case SkrillTransactionStatus.Processed:
            case SkrillTransactionStatus.Failed:
                return IocContainer.get(OrderNotificationProcessor);

            default:
                throw new Error(`Skrill transaction status '${status}' not supported.`);
        }
    }
}