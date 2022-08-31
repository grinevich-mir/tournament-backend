import { Authenticator } from './authenticator';
import { UnauthorizedError } from '../../core/errors';
import { CognitoAuthenticator } from './cognito.authenticator';
import { CognitoAdminAuthenticator } from './cognito-admin.authenticator';
import { IocContainer, ServiceIdentifier } from '../../core/ioc';
import Logger from '../../core/logging';
import { ApiUser } from '../api-user';
import { ApiRequest } from '../api-request';

const cache: { [type: string]: Authenticator } = {};

export interface Authenticators {
    [name: string]: ServiceIdentifier<Authenticator<any>>;
}

export let authenticatorRegistry: Authenticators = {
    cognito: CognitoAuthenticator,
    admin: CognitoAdminAuthenticator
};

function createAuthenticator(type: string): Authenticator {
    if (cache[type])
        return cache[type];

    Logger.info(`Creating ${type} authenticator...`);

    const authType = authenticatorRegistry[type];

    if (!authType)
        throw new Error(`Authenticator type ${type} is not supported.`);

    const instance = IocContainer.get(authType);

    cache[type] = instance;
    return instance;
}

export function registerAuthenticators(authenticators?: Authenticators): void {
    if (!authenticators)
        return;

    authenticatorRegistry = authenticators;
}

export async function authenticator(request: ApiRequest, securityName: string, scopes?: string[]): Promise<ApiUser | undefined> {
    try {
        const filteredScopes = !scopes ? [] : scopes.filter(s => s !== 'anonymous');
        return await createAuthenticator(securityName).execute(request, filteredScopes) as ApiUser | undefined;
    } catch (err) {
        if (!scopes || !scopes.includes('anonymous'))
            Logger.warn('Authentication failed:', err);
        throw new UnauthorizedError(err.message);
    }
}
