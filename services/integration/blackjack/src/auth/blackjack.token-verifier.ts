import sha1 from 'sha1';
import { Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
export class BlackjackTokenVerifier {
    public async verify(token: string, secret: string, alphabeticValues: string): Promise<void> {
        const expectedHash = this.generateHash(secret, alphabeticValues);

        if (token.toLowerCase() !== expectedHash.toLowerCase()) {
            console.error('Token does not match expected hash.');
            throw new Error('Invalid authorization token');
        }
    }

    private generateHash(secret: string, alphabeticValues: string): string {
        return sha1(secret + alphabeticValues);
    }
}