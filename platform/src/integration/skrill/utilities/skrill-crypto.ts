import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import crypto from 'crypto';

@Singleton
@LogClass()
export class SkrillCrypto {
    public hash(input: string): string {
        return crypto.createHash('md5').update(input).digest('hex').toUpperCase();
    }
}