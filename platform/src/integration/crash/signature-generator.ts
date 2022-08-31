import { Singleton, Inject } from '../../core/ioc';
import { ParameterStore, Config } from '../../core';
import sha1 from 'sha1';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class SignatureGenerator {
    constructor(
        @Inject private readonly parameterStore: ParameterStore) {
        }

    public async generate(body: any): Promise<string> {
        const key = await this.parameterStore.get(`/${Config.stage}/integration/crash/operator-secret`, true, true);
        const bodyValString = this.getBodyValString(body);
        return sha1(`${key}${bodyValString}`);
    }

    private getBodyValString(body: any): string {
        if (!body)
            return '';

        if (typeof body !== 'object')
            return String(body);

        const keys = Object.keys(body);

        if (keys.length === 0)
            return '';

        const bodyValues: any[] = [];

        for (const key of keys) {
            if (typeof body[key] === 'object')
                continue;

            bodyValues.push(body[key]);
        }

        if (bodyValues.length === 0)
            return '';

        bodyValues.sort();
        return bodyValues.join('');
    }
}
