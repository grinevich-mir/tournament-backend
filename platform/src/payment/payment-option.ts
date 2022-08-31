import { PaymentMethodType } from './payment-method-type';
import { PaymentProvider } from './payment-provider';

export interface NewPaymentOption {
    provider: PaymentProvider;
    name: string;
    countries: string[];
    currencies: string[];
    methodTypes: PaymentMethodType[];
    enabled: boolean;
    public: boolean;
}

export interface PaymentOption extends NewPaymentOption {
    id: number;
    createTime: Date;
    updateTime: Date;
}

export type PaymentOptionUpdate = Omit<NewPaymentOption, 'provider'>;