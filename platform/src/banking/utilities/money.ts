import Dinero, { Dinero as DineroInstance, Currency } from 'dinero.js';
import CurrencyInfo from 'currency-format';

export type Money = DineroInstance;

function getDecimalPlaces(currencyCode: string): number {
    const currencies: { [code: string]: { name: string, fractionSize: number } } = CurrencyInfo;

    if (currencyCode === 'DIA')
        return 0;
    if (currencies[currencyCode])
        return currencies[currencyCode].fractionSize;

    return 2;
}

export function toMoney(amount: number, currencyCode?: string): Money {
    const options: Dinero.Options = {
        amount: Math.round(amount * Math.pow(10, 4)),
        precision: 4
    };

    if (currencyCode)
        options.currency = currencyCode as Currency;

    return Dinero(options);
}

export function roundMoney(amount: number | Money, currencyCode: string): number {
    if (typeof amount === 'number')
        amount = toMoney(amount);

    const precision = getDecimalPlaces(currencyCode);
    return amount.toRoundedUnit(precision);
}

export function centsToMoney(amount: number, currencyCode: string): Money {
    const precision = getDecimalPlaces(currencyCode);
    return Dinero({amount, precision}).convertPrecision(4);
}

export function formatMoney(amount: number, currency: string | Currency): string {
    if (amount && !Number(amount))
        throw new Error('Amount value must be a number.');

    if (currency === 'DIA')
        return `${amount} Diamond${amount !== 1 ? `s` : ``}`;

    return toMoney(amount, currency).setLocale('en-US').toFormat();
}
