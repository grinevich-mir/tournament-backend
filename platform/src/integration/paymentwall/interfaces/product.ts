export enum PaymentwallProductType {
    Subscription = 'subscription',
    Fixed = 'fixed',
}

export enum PaymentwallProductPeriodType {
    Day = 'day',
    Week = 'week',
    Month = 'month',
    Year = 'year'
}

export interface PaymentwallProduct {
    id?: string;
    amount?: number;
    currencyCode?: string;
    name?: string;
    type?: PaymentwallProductType;
    periodLength?: number;
    periodType?: PaymentwallProductPeriodType;
    recurring?: boolean;
    trialProduct?: PaymentwallProduct;
}