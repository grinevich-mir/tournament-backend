import { Config, ParameterStore } from '../../core';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { PayPalEnvironment } from './interfaces';
import { PayPalLiveEnvironment, PayPalSandboxEnvironment } from './environments';

@Singleton
@LogClass({ result: false })
export class PayPalEnvironmentFactory {
    constructor(
        @Inject private readonly parameterStore: ParameterStore) {
    }

    public async create(): Promise<PayPalEnvironment> {
        const clientId = await this.parameterStore.get(`/${Config.stage}/integration/paypal/client-id`, false, true);
        const clientSecret = await this.parameterStore.get(`/${Config.stage}/integration/paypal/client-secret`, true, true);

        return Config.stage === 'prod'
            ? new PayPalLiveEnvironment(clientId, clientSecret)
            : new PayPalSandboxEnvironment(clientId, clientSecret);
    }
}