import { Authenticator } from './authenticator';
import { AdminUser } from '../admin-user';
import { CognitoAdminTokenVerifier } from './cognito-admin.token-verifier';
import { Inject, Singleton } from '../../core/ioc';
import { UnauthorizedError } from '../../core';
import Logger, { LogClass } from '../../core/logging';
import { ApiRequest } from '../api-request';

@Singleton
@LogClass()
export class CognitoAdminAuthenticator implements Authenticator<AdminUser> {
    constructor(@Inject private readonly tokenVerifier: CognitoAdminTokenVerifier) {
    }

    public async execute(request: ApiRequest, scopes?: string[]): Promise<AdminUser> {
        const token = this.getToken(request);
        return this.tokenVerifier.verify(token, scopes);
    }

    private getToken(request: ApiRequest): string {
        let token = this.getTokenFromHeader(request);

        if (!token)
            token = this.getTokenFromQuery(request);

        if (!token)
            throw new UnauthorizedError('Access token not supplied.');

        return token;
    }

    private getTokenFromHeader(request: ApiRequest): string | undefined {
        const tokenString = request.headers.authorization;
        if (!tokenString) {
            Logger.warn('Authorization header was not supplied.');
            return;
        }

        const match = tokenString.match(/^Bearer (.*)$/);
        if (!match || match.length < 2) {
            Logger.warn(`Invalid Token: ${tokenString} does not match "Bearer .*"`);
            return;
        }

        return match[1];
    }

    private getTokenFromQuery(request: ApiRequest): string | undefined {
        const tokenString = request.query.token;

        if (!tokenString)
            return;

        return tokenString;
    }
}
