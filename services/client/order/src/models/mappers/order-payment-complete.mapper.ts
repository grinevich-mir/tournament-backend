import { Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { PaymentResult, Payment, PaymentStatus, PaymentActionType } from '@tcom/platform/lib/payment';
import { OrderStatus } from '@tcom/platform/lib/order';
import { OrderPaymentCompleteModel } from '../order-payment-complete.model';

@Singleton
@LogClass()
export class OrderPaymentCompleteModelMapper {
    public from(status: OrderStatus, payment?: Payment): OrderPaymentCompleteModel {
        let result;

        if (payment)
            result = this.toPaymentResult(payment);

        return { status, payment: result };
    }

    private toPaymentResult(source: Payment): PaymentResult {
        switch (source.status) {
            case PaymentStatus.Successful:
                return {
                    provider: source.provider,
                    status: PaymentStatus.Successful
                };

            case PaymentStatus.Pending:
                return {
                    provider: source.provider,
                    status: PaymentStatus.Pending,
                    action: {
                        type: PaymentActionType.Prompt,
                        title: 'Payment Pending',
                        message: 'Your payment is being processed but it could take a few days. We will email you to let you know when the payment has been completed.'
                    }
                };

            default:
                return {
                    provider: source.provider,
                    status: source.status,
                    action: {
                        type: PaymentActionType.Retry
                    }
                };
        }
    }
}