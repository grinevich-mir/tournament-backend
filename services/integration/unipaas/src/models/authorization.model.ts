import { UnipaasCheckoutItem, NewUnipaasPaymentOption } from '@tcom/platform/lib/integration/unipaas';

export interface AuthorizationModel {
    authorizationId: string;
    transactionId: string;
    paymentOption: NewUnipaasPaymentOption;
    currency: string;
    amount: number;
    orderid: string;
    items: UnipaasCheckoutItem[];
}