import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { SkrillClient } from './skrill-client';
import { SkrillEnvironmentFactory } from './skrill-environment.factory';

@Singleton
@LogClass()
export class SkrillClientFactory {
    constructor(
        @Inject private readonly environmentFactory: SkrillEnvironmentFactory) {
    }

    public async create(): Promise<SkrillClient> {
        const environment = await this.environmentFactory.create();
        return new SkrillClient(environment);
    }
}
