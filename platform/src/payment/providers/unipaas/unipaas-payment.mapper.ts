import _ from 'lodash';
import moment from 'moment';
import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { UnipaasAuthorization, UnipaasAuthorizationStatus } from '../../../integration/unipaas';
import { NewPayment } from '../../new-payment';
import { Payment } from '../../payment';
import { PaymentMethod } from '../../payment-method';
import { PaymentProvider } from '../../payment-provider';
import { PaymentStatus } from '../../payment-status';
import { PaymentType } from '../../payment-type';

@Singleton
@LogClass()
export class UnipaasPaymentMapper {
    public toNewPayment(authorization: UnipaasAuthorization, paymentMethod: PaymentMethod): NewPayment {
        return {
            userId: paymentMethod.userId,
            provider: PaymentProvider.Unipaas,
            type: PaymentType.Purchase,
            status: this.mapStatus(authorization.authorizationStatus),
            amount: authorization.amount,
            currencyCode: authorization.currency,
            providerRef: authorization.authorizationId,
            paymentMethodId: paymentMethod.id,
            createTime: moment(authorization.created_at).toDate()
        };
    }

    public toPayment(id: number, authorization: UnipaasAuthorization, paymentMethod: PaymentMethod): Payment {
        const payment: Partial<Payment> = {
            id,
            provider: PaymentProvider.Unipaas,
            userId: paymentMethod.userId,
            type: PaymentType.Purchase,
            status: this.mapStatus(authorization.authorizationStatus),
            amount: authorization.amount,
            currencyCode: authorization.currency,
            providerRef: authorization.authorizationId,
            paymentMethodId: paymentMethod.id,
            createTime: moment(authorization.created_at).toDate()
        };

        return payment as Payment;
    }

    public mapStatus(status: UnipaasAuthorizationStatus): PaymentStatus {
        switch (status) {
            default:
                return PaymentStatus.Pending;

            case UnipaasAuthorizationStatus.Error:
            case UnipaasAuthorizationStatus.Declined:
                return PaymentStatus.Declined;

            case UnipaasAuthorizationStatus.Voided:
            case UnipaasAuthorizationStatus.Refunded:
                return PaymentStatus.Refunded;

            case UnipaasAuthorizationStatus.Captured:
                return PaymentStatus.Successful;
        }
    }
}