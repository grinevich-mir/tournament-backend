import jwt, { TokenExpiredError } from 'jsonwebtoken';
import jwksClient, { CertSigningKey, RsaSigningKey, SigningKey } from 'jwks-rsa';
import util from 'util';
import { TokenPayload, DecodedToken } from './authenticator';
import { Singleton, Inject } from '../../core/ioc';
import _ from 'lodash';
import Logger, { LogClass } from '../../core/logging';
import { SkinManager } from '../../skin';
import { User, UserManager } from '../../user';
import { UnauthorizedError } from '../../core';

@Singleton
@LogClass()
export class CognitoTokenVerifier {
    private jwksClients: { [issuer: string]: jwksClient.JwksClient } = {};

    constructor(
        @Inject private readonly skinManager: SkinManager,
        @Inject private readonly userManager: UserManager) {
        }

    public async verify(token: string, scopes?: string[]): Promise<User> {
        const decoded = jwt.decode(token, { complete: true }) as DecodedToken;
        if (!decoded || !decoded.header || !decoded.header.kid) {
            Logger.error('JWT token does not contain header and/or kid parameters.');
            throw new Error('Invalid authorization token');
        }

        if (!decoded.payload.token_use || decoded.payload.token_use !== 'access')
            throw new Error('Invalid authorization token');

        Logger.debug('Decoded Token', decoded);
        const issuer = decoded.payload.iss;
        const userPoolId = this.getUserPoolId(issuer);

        if (!userPoolId)
            throw new Error('Could not get User Pool ID');

        const skin = await this.skinManager.getByUserPoolId(userPoolId);

        if (!skin) {
            Logger.error(`Could not find skin associated with user pool '${userPoolId}'.`);
            throw new Error('Invalid authorization token');
        }

        const key = await this.getSigningKey(issuer, decoded.header.kid);

        const jwtOptions: jwt.VerifyOptions = {
            issuer
        };

        const signingKey = ((key as CertSigningKey).publicKey || (key as RsaSigningKey).rsaPublicKey) as string;
        const payload = this.verifyToken(token, signingKey, jwtOptions);

        this.checkScopes(payload, scopes);
        return this.getUser(payload);
    }

    private verifyToken(token: string, signingKey: string, options: jwt.VerifyOptions): TokenPayload {
        try {
            const payload = jwt.verify(token, signingKey, options) as TokenPayload;
            Logger.debug('Verified Token Payload', payload);
            return payload;
        } catch (err) {
            if (err instanceof TokenExpiredError)
                throw new UnauthorizedError('Access token expired.');

            throw err;
        }
    }

    private checkScopes(payload: TokenPayload, scopes?: string[]): void {
        if (!scopes || scopes.length === 0)
            return;

        if (!payload.scope)
            throw new Error(`Token does not include any scopes.`);

        const payloadScopes = payload.scope.split(' ');
        for (const scope of scopes)
            if (!payloadScopes.includes(scope))
                throw new Error(`Token does not include required '${scope}' scope.`);
    }

    private async getUser(payload: TokenPayload): Promise<User> {
        const user = await this.userManager.get(payload.sub);

        if (!user) {
            Logger.error(`User not found with secure ID ${payload.sub}`);
            throw new UnauthorizedError('User not found.');
        }

        if (!user.enabled) {
            await this.userManager.setOnline(user.id, false);
            throw new UnauthorizedError('User is disabled.');
        }

        await this.userManager.setOnline(user.id, true);
        return user;
    }

    private getClient(issuer: string): jwksClient.JwksClient {
        if (!this.jwksClients[issuer])
            this.jwksClients[issuer] = jwksClient({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 1200,
                jwksUri: `${issuer}/.well-known/jwks.json`
            });

        return this.jwksClients[issuer];
    }

    private async getSigningKey(issuer: string, kid: string): Promise<SigningKey> {
        const client = this.getClient(issuer);
        const getSigningKey = util.promisify(client.getSigningKey);
        return getSigningKey(kid);
    }

    private getUserPoolId(issuer: string): string {
        return issuer.split('/').slice(-1)[0];
    }
}