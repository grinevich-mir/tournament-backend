import { Singleton, Inject } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { PayPalClient } from './paypal-client';
import { PayPalEnvironmentFactory } from './paypal-environment.factory';

@Singleton
@LogClass()
export class PayPalClientFactory {
    constructor(
        @Inject private readonly environmentFactory: PayPalEnvironmentFactory) {
    }

    public async create(): Promise<PayPalClient> {
        const environment = await this.environmentFactory.create();
        return new PayPalClient(environment);
    }
}
