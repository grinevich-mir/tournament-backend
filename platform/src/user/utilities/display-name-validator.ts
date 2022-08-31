import { Singleton } from '../../core/ioc';
import profanity from 'profanity-util';
import { LogClass } from '../../core/logging';
import { DISPLAY_NAME_BLACKLIST } from './display-name-blacklist';

const VALIDATION_REGEX = /^(?![_.-])(?!.*[_.-]{2})[a-zA-Z0-9_.-]+(?<![_.-])$/;

export interface ValidationResult {
    valid: boolean;
    profane?: boolean;
    invalidCharacters?: boolean;
    empty?: boolean;
    tooShort?: boolean;
    tooLong?: boolean;
}

@Singleton
@LogClass()
export class DisplayNameValidator {
    public async validate(value: string): Promise<ValidationResult> {
        const result: ValidationResult = {
            valid: false
        };

        if (DISPLAY_NAME_BLACKLIST.some(v => value.toLowerCase().includes(v)))
            return result;

        if (!value)
            result.empty = true;

        if (value.length < 5)
            result.tooShort = true;

        if (value.length > 20)
            result.tooLong = true;

        if (!VALIDATION_REGEX.test(value))
            result.invalidCharacters = true;

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