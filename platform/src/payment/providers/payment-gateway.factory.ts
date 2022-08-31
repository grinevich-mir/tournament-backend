import { IocContainer, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { PaymentProvider } from '../payment-provider';
import { ChargifyPaymentGateway } from './chargify';
import { PaymentGateway } from './payment-gateway';
import { PayPalPaymentGateway } from './paypal';
import { TrustlyPaymentGateway } from './trustly';
import { UnipaasPaymentGateway } from './unipaas';
import { SkrillPaymentGateway } from './skrill';
import { PaymentwallPaymentGateway } from './paymentwall';

@Singleton
@LogClass({ result: false })
export class PaymentGatewayFactory {
    public create(provider: PaymentProvider): PaymentGateway {
        switch (provider) {
            case PaymentProvider.Chargify:
                return IocContainer.get(ChargifyPaymentGateway);

            case PaymentProvider.Unipaas:
                return IocContainer.get(UnipaasPaymentGateway);

            case PaymentProvider.Trustly:
                return IocContainer.get(TrustlyPaymentGateway);

            case PaymentProvider.PayPal:
                return IocContainer.get(PayPalPaymentGateway);

            case PaymentProvider.Skrill:
                return IocContainer.get(SkrillPaymentGateway);

            case PaymentProvider.Paymentwall:
                return IocContainer.get(PaymentwallPaymentGateway);
        }
    }
}