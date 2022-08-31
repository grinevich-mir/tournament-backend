import { IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { NotificationProcessor } from './notification-processor';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { NotificationModel, NotificationType } from '../models';
import { PaymentNotificationProcessor, RefundNotificationProcessor, RenewalNotificationProcessor } from './processors';

@Singleton
@LogClass({ result: false })
export class NotificationProcessorFactory {
    public create<T extends NotificationModel>(notification: T): NotificationProcessor<T> | undefined {
        switch(notification.event) {
            case NotificationType.PaymentSuccess:
            case NotificationType.PaymentFailure:
                return IocContainer.get(PaymentNotificationProcessor) as NotificationProcessor<T>;

            case NotificationType.RenewalSuccess:
                return IocContainer.get(RenewalNotificationProcessor) as NotificationProcessor<T>;

            case NotificationType.RefundSuccess:
                return IocContainer.get(RefundNotificationProcessor) as NotificationProcessor<T>;
        }

        return undefined;
    }
}