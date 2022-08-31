declare module 'profanity-util' {
    interface ProfanityOptions {
        forbiddenList?: string[];
        substrings?: boolean | 'lite',
    }

    interface ProfanityCheckOptions extends ProfanityOptions {
        substringList?: string[];
    }

    interface ProfanityPurifyOptions extends ProfanityOptions {
        replacementsList?: string[];
        obscureSymbol?: string;
        replace?: boolean;
        map?: { [key: string]: string }
    }

    interface ProfanityUtil {
        check(targetString: string, options?: ProfanityCheckOptions): string[];
        purify(target: string, options?: ProfanityPurifyOptions): string[];
        purify<T>(target: T, options?: ProfanityPurifyOptions): any[];
    }

    var util: ProfanityUtil;
    export default util;
}