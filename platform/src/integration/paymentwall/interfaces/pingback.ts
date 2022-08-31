export interface PaymentwallPingbackParams {
    parameters: string | Record<string, string>;
    ipAddress: string;
}

export enum PaymentwallPingbackType {
    Regular = 0,
    Goodwill = 1,
    Negative = 2
}

export interface PaymentwallPingback {
    type: PaymentwallPingbackType;
    userId: string;
    orderId: string;
    referenceId: string;
    uniqueId: string;
    paymentType: string;
    paymentMethodToken: string;
}