import { CognitoTokenVerifier } from '@tcom/platform/lib/api/auth/cognito.token-verifier';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LoginRequest } from './auth.interfaces';
import { WebsocketManager } from '@tcom/platform/lib/websocket';

export class AuthController {
    constructor(
        @Inject private readonly manager: WebsocketManager,
        @Inject private readonly cognitoTokenVerifier: CognitoTokenVerifier) {
    }

    public async login(id: string, request: LoginRequest): Promise<void> {
        if (!request.token)
            throw new Error('Token not supplied.');

        console.log(`Authenticating connection ID ${id} with token ${request.token}`);
        const user = await this.cognitoTokenVerifier.verify(request.token);
        console.log('User', JSON.stringify(user));
        await this.manager.setUserId(id, user.id);
    }

    public async logout(id: string): Promise<void> {
        console.log(`Logging out connection ID ${id}`);
        await this.manager.unsetUserId(id);
    }
}
