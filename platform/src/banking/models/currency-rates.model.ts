/**
 * @example
 * {
 *    "GBP": 1.5543,
 *    "DIA": 0.1
 * }
 */
export interface CurrencyRatesModel {
    [code: string]: number;
}