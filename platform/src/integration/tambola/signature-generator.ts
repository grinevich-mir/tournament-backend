import sha1 from 'sha1';
import { Config, ParameterStore } from '../../core';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass({ result: false })
export class SignatureGenerator {
    constructor(
        @Inject private readonly parameterStore: ParameterStore) {
        }

    public async generate(body: any): Promise<string> {
        const key = await this.parameterStore.get(`/${Config.stage}/integration/tambola/operator-secret`, true, true);
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