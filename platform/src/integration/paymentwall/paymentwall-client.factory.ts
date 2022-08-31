import { Config, ParameterStore } from '../../core';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { PaymentwallClient } from './paymentwall-client';

@Singleton
@LogClass()
export class PaymentwallClientFactory {
    constructor(@Inject private readonly parameterStore: ParameterStore) { }

    public async create(): Promise<PaymentwallClient> {
        const appKey = await this.getParameter('app-key', false);
        const secretKey = await this.getParameter('secret-key', true);
        return new PaymentwallClient(appKey, secretKey);
    }

    private async getParameter(name: string, decrypt: boolean = true): Promise<string> {
        return this.parameterStore.get(`/${Config.stage}/integration/paymentwall/${name}`, decrypt, true);
    }
}