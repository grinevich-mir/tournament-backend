export enum PaymentwallApiType {
    VirtualCurrency = 1,
    DigitalGoods = 2,
    Cart = 3
}

export interface PaymentwallApiError {
    object: string;
    type: string;
    error: string;
    code: number;
}