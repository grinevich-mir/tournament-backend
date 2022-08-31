import { ValidationResult } from './utilities';

export interface DisplayNameValidationResult extends ValidationResult {
    available: boolean;
}