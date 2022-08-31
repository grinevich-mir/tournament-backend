declare module 'paymentwall' {
    export class Product {
        constructor(
            productId?: string,
            amount?: number,
            currencyCode?: string,
            name?: string,
            productType?: 'subscription' | 'fixed',
            periodLength?: number,
            periodType?: 'day' | 'week' | 'month' | 'year',
            recurring?: boolean,
            trialProduct?: Product);
    }

    export class Widget {
        constructor(userId?: string, widgetCode?: string, products?: Product[], extraParams?: Record<string, string | number>);
        public getUrl(): string;
        public getHtmlCode(attributes?: Record<string, string>): string;
    }

    export interface WidgetSignature {
        calculateSignature(params: Record<string, string> | undefined, secretKey: string, version: number): string;
    }

    export class Pingback {
        constructor(parameters: string | object, ipAddress: string);
        public validate(): boolean;
        public getType(): number;
        public getUserId(): string;
        public getProductId(): string;
        public getReferenceId(): string;
        public getPingbackUniqueId(): string;
        public getParameter(key: string): string;
        public isDeliverable(): boolean;
        public isCancelable(): boolean;
    }

    export interface Config {
        apiType: number;
        appKey: string;
        secretKey: string;
    }

    export interface Base extends Config {
        API_VC: 1;
        API_GOODS: 2;
        API_CART: 3;
    }

    export const Base: Base;
    export const WidgetSignature: WidgetSignature;
    export function Configure(apiType: number, appKey: string, secretKey: string): void;
}