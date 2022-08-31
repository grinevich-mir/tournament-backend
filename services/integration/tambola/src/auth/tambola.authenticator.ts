import { Request } from 'express';
import { TambolaTokenVerifier } from './tambola.token-verifier';
import { Authenticator } from '@tcom/platform/lib/api/auth/authenticator';
import { ParameterStore } from '@tcom/platform/lib/core/parameter-store';
import { Config } from '@tcom/platform/lib/core/config';
import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
export class TambolaAuthenticator implements Authenticator {
    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly tokenVerifier: TambolaTokenVerifier) {
    }

    public async execute(request: Request, scopes?: string[]): Promise<void> {
        const token = this.getToken(request);
        const alphabeticValues = this.getAlphabeticValues(request);
        const secret = await this.parameterStore.get(
                `/${Config.stage}/integration/tambola/operator-secret`,
            true,
            true);

        await this.tokenVerifier.verify(token, secret, alphabeticValues);
    }

    private getToken(request: Request): string {
        const tokenString = request.headers['x-tcom-sig'];
        if (!tokenString)
            throw new Error('Signature header was not supplied.');

        return String(tokenString);
    }

    private getAlphabeticValues(request: Request): string {
        const alphabeticValues = [];

        for (const elem in request.body)
            if (!(request.body[elem] instanceof Object))
                alphabeticValues.push(request.body[elem]);

        return alphabeticValues.sort().join('');
    }
}
