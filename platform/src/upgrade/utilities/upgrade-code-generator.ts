import { Singleton } from '../../core/ioc';
import generate from 'nanoid/generate';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

@Singleton
export class UpgradeCodeGenerator {
    public generate(): string {
        return generate(alphabet, 16);
    }
}
