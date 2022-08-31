import jwt, { TokenExpiredError } from 'jsonwebtoken';
import jwksClient, { CertSigningKey, RsaSigningKey, SigningKey } from 'jwks-rsa';
import util from 'util';
import { AdminUser } from '../admin-user';
import { TokenPayload, DecodedToken } from './authenticator';
import { Inject, Singleton } from '../../core/ioc';
import Logger, { LogClass } from '../../core/logging';
import { ForbiddenError, UnauthorizedError } from '../../core';
import { UserPermissionsManager } from '../../permissions';
import * as env from 'env-var';

@Singleton
@LogClass()
export class CognitoAdminTokenVerifier {
    private jwksClients: { [issuer: string]: jwksClient.JwksClient } = {};

    constructor(@Inject private readonly userPermissionsManager: UserPermissionsManager) {
    }

    public async verify(token: string, scopes?: string[]): Promise<AdminUser> {
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

        const expectedUserPoolId = env.get('ADMIN_USER_POOL_ID').required().asString();

        if (userPoolId !== expectedUserPoolId)
            throw new Error('Unexpected User Pool ID');

        const key = await this.getSigningKey(issuer, decoded.header.kid);

        const jwtOptions: jwt.VerifyOptions = {
            issuer
        };

        const signingKey = ((key as CertSigningKey).publicKey || (key as RsaSigningKey).rsaPublicKey) as string;
        const payload = this.verifyToken(token, signingKey, jwtOptions);

        await this.checkScopes(payload, scopes);
        return new AdminUser(payload.sub, payload.username);
    }

    private verifyToken(token: string, signingKey: string, options: jwt.VerifyOptions): TokenPayload {
        try {
            const payload = jwt.verify(token, signingKey, options) as TokenPayload;
            Logger.info('Verified Token Payload', payload);
            return payload;
        } catch (err) {
            if (err instanceof TokenExpiredError)
                throw new UnauthorizedError('Access token expired.');

            throw err;
        }
    }

    private async checkScopes(payload: TokenPayload, scopes?: string[]): Promise<void> {
        if (!scopes || scopes.length === 0)
            return;

        if (!payload.scope)
            throw new Error(`Token does not include any scopes.`);

        if (!payload.sub)
            throw new Error('Token does not include user Id.');

        const userHasAccess = await this.userPermissionsManager.hasAccess(payload.sub, ...scopes);

        if (!userHasAccess)
            throw new ForbiddenError(`User does not have permissions to access resource.`);
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
