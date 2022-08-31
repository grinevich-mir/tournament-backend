import { Config, ParameterStore } from '../../core';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { SkrillEnvironment } from './skrill-environment';
import { SkrillCrypto } from './utilities';

@Singleton
@LogClass()
export class SkrillEnvironmentFactory {
    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly crypto: SkrillCrypto) {
    }

    public async create(): Promise<SkrillEnvironment> {
        const email = await this.getParameter('integration/skrill/merchant-email', false);
        const password = await this.getPassword();
        const statusUrl = `https://integrations.${Config.domain}/skrill/notification`;
        return new SkrillEnvironment(email, password, statusUrl);
    }

    private async getParameter(key: string, decrypt: boolean): Promise<string> {
        return this.parameterStore.get(`/${Config.stage}/${key}`, decrypt, true);
    }

    private async getPassword(): Promise<string> {
        const password = await this.getParameter('integration/skrill/mqi-password', true);
        return this.crypto.hash(password);
    }
}