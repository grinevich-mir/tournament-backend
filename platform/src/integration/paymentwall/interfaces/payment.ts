export interface PaymentwallPayment {
    id: string;
    object: string;
    created: string;
    amount: number;
    currency: string;
    refunded: boolean;
    risk: string;
    uid: string;
    product_id: string;
    payment_system: string;
}

export interface PaymentwallTransaction extends PaymentwallPayment {
    paymentType: string;
    paymentMethodToken: string;
}