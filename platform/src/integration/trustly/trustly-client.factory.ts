import { Config, ParameterStore } from '../../core';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { TrustlyClient } from './trustly-client';

@Singleton
@LogClass()
export class TrustlyClientFactory {
    constructor(
        @Inject private readonly parameterStore: ParameterStore) {
        }

    public async create(): Promise<TrustlyClient> {
        const accessId = await this.parameterStore.get(`/${Config.stage}/integration/trustly/access-id`, false, true);
        const accessKey = await this.parameterStore.get(`/${Config.stage}/integration/trustly/access-key`, true, true);
        return new TrustlyClient(accessId, accessKey, Config.stage === 'prod' ? 'live' : 'test');
    }
}