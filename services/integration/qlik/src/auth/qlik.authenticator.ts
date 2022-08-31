import { Request } from 'express';
import { Authenticator } from '@tcom/platform/lib/api/auth/authenticator';
import { ParameterStore } from '@tcom/platform/lib/core/parameter-store';
import { Config } from '@tcom/platform/lib/core/config';
import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
export class QlikAuthenticator implements Authenticator {
    constructor(@Inject private readonly parameterStore: ParameterStore) { }

    public async execute(request: Request, scopes?: string[]): Promise<void> {
        const token = this.getToken(request);
        const secret = await this.parameterStore.get(`/${Config.stage}/integration/qlik/api-key`, true, true);
        await this.verify(token, secret);
    }

    private getToken(request: Request): string {
        const tokenString = request.headers['x-api-key'];
        if (!tokenString)
            throw new Error('API key header was not supplied.');

        return String(tokenString);
    }

    private async verify(token: string, secret: string): Promise<void> {
        if (token.toLowerCase() !== secret.toLowerCase())
            throw new Error('Invalid authorization token');
    }
}
