declare module 'iso-country-currency' {
    export interface ISOCountry {
        countryName: string;
        currency: string;
        symbol: string;
    }

    export interface ISOCountryFull {
        iso: string;
        countryName: string;
        currency: string;
        symbol: string;
    }

    export function getAllISOCodes(): ISOCountryFull[];
    export function getAllInfoByISO(iso: string): ISOCountry;
    export function getParamByISO(iso: string, param: keyof ISOCountry): string;
    export function getISOByParam(param: keyof ISOCountry, value: string): string;
    export function getParamByParam(param: keyof ISOCountry, value: string, searchParam: keyof ISOCountry): string;
    export function getAllCountriesByCurrencyOrSymbol(param: keyof ISOCountry, value: string): string[];
    export function getAllISOByCurrencyOrSymbol(param: 'currency' | 'symbol', value: string): string[];
}