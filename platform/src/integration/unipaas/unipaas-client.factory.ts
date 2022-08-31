import { Config, ParameterStore } from '../../core';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { UnipaasClient } from './unipaas-client';

@Singleton
@LogClass()
export class UnipaasClientFactory {
    constructor(
        @Inject private readonly parameterStore: ParameterStore) {
        }

    public async create(): Promise<UnipaasClient> {
        const apiKey = await this.parameterStore.get(`/${Config.stage}/integration/unipaas/api-key`, true, true);
        return new UnipaasClient(apiKey, Config.stage === 'prod' ? 'live' : 'test');
    }
}