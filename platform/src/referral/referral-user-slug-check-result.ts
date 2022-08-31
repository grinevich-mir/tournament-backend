import { SlugValidationResult } from './utilities';

export interface ReferralUserSlugCheckResult extends SlugValidationResult {
    available: boolean;
}