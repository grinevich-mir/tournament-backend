import { Singleton } from '../../core/ioc';
import profanity from 'profanity-util';
import { LogClass } from '../../core/logging';
import { SLUG_BLACKLIST } from './slug-blackist';

export interface SlugValidationResult {
    valid: boolean;
    profane?: boolean;
    invalidCharacters?: boolean;
    empty?: boolean;
    tooShort?: boolean;
    tooLong?: boolean;
}

@Singleton
@LogClass()
export class SlugValidator {
    public async validate(value: string): Promise<SlugValidationResult> {
        const result: SlugValidationResult = {
            valid: false
        };

        if (SLUG_BLACKLIST.some(v => value.toLowerCase().includes(v)))
            return result;

        if (!value)
            result.empty = true;

        if (value.length < 5)
            result.tooShort = true;

        if (value.length > 30)
            result.tooLong = true;

        if (this.checkForProfanity(value))
            result.profane = true;

        if (Object.keys(result).filter(k => k !== 'valid').length === 0)
            result.valid = true;

        return result;
    }

    private checkForProfanity(value: string): boolean {
        const result = profanity.check(value, {
            substrings: 'lite'
        });

        return result.length > 0;
    }
}