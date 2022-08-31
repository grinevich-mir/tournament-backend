import { Singleton, IocContainer } from '../../core/ioc';
import { SubscriptionGateway } from './subscription-gateway';
import { LogClass } from '../../core/logging';
import { ChargifySubscriptionGateway } from './chargify';
import { PaymentProvider } from '../../payment';

@Singleton
@LogClass({ result: false })
export class SubscriptionGatewayFactory {
    public create(provider: PaymentProvider): SubscriptionGateway {
        switch (provider) {
            case PaymentProvider.Chargify:
                return IocContainer.get(ChargifySubscriptionGateway);
        }

        throw new Error(`Subscriptions are not supported for provider ${provider}`);
    }
}