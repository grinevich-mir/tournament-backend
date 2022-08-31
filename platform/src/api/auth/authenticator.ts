import { ApiUser } from '../api-user';
import { ApiRequest } from '../api-request';

export interface DecodedToken {
    header: {
        typ: string;
        alg: string;
        kid: string;
    };
    payload: TokenPayload;
    signature: string;
}

export interface TokenPayload {
    iss: string;
    sub: string;
    aud: string;
    iat: number;
    exp: number;
    azp: string;
    scope: string;
    [key: string]: any;
}

export interface Authenticator<TUser extends ApiUser | void = void> {
    execute(request: ApiRequest, scopes?: string[]): Promise<TUser>;
}