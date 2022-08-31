import { Request } from 'express';
import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { Config, ParameterStore } from '@tcom/platform/lib/core';
import { CrashTokenVerifier } from './crash.token-verifier';
import { Authenticator } from '@tcom/platform/lib/api/auth/authenticator';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
export class CrashAuthenticator implements Authenticator {
    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly tokenVerifier: CrashTokenVerifier) {
    }

    public async execute(request: Request, scopes?: string[]): Promise<void> {
        const token = this.getToken(request);
        const alphabeticValues = this.getAlphabeticValues(request);
        const parameterKey = `/${Config.stage}/integration/crash/operator-secret`;
        const secret = await this.parameterStore.get(parameterKey, true, true);

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
