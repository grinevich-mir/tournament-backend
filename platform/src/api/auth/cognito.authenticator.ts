import { Authenticator } from './authenticator';
import { Request } from 'express';
import { CognitoTokenVerifier } from './cognito.token-verifier';
import { Inject, Singleton } from '../../core/ioc';
import { UnauthorizedError } from '../../core';
import Logger, { LogClass } from '../../core/logging';
import { ApiRequest } from '../api-request';
import { User } from '../../user';

@Singleton
@LogClass()
export class CognitoAuthenticator implements Authenticator<User> {
    constructor(
        @Inject private readonly tokenVerifier: CognitoTokenVerifier) {
    }

    public async execute(request: ApiRequest, scopes?: string[]): Promise<User> {
        const token = this.getToken(request);
        return this.tokenVerifier.verify(token, scopes);
    }

    private getToken(request: Request): string {
        let token = this.getTokenFromHeader(request);

        if (!token)
            token = this.getTokenFromQuery(request);

        if (!token)
            throw new UnauthorizedError('Access token not supplied.');

        return token;
    }

    private getTokenFromHeader(request: Request): string | undefined {
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

    private getTokenFromQuery(request: Request): string | undefined {
        const tokenString = request.query.token;

        if (!tokenString)
            return;

        return tokenString;
    }
}