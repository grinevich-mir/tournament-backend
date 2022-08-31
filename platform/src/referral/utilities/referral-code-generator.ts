import { Singleton } from '../../core/ioc';
import generate from 'nanoid/generate';
import { LogClass } from '../../core/logging';

const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

@Singleton
@LogClass()
export class ReferralCodeGenerator {
    public generate(): string {
        return generate(alphabet, 8);
    }
}
