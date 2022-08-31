import { Config, ParameterStore } from '../../core';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { ChargifyClient } from './chargify-client';

@Singleton
@LogClass()
export class ChargifyClientFactory {
    constructor(
        @Inject private readonly parameterStore: ParameterStore) {
        }

    public async create(skinId: string): Promise<ChargifyClient> {
        const subdomain = await this.parameterStore.get(`/${Config.stage}/integration/chargify/${skinId}/subdomain`, false, true);
        const apiKey = await this.parameterStore.get(`/${Config.stage}/integration/chargify/${skinId}/api-key`, true, true);
        return new ChargifyClient(subdomain, apiKey);
    }
}