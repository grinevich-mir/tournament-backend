import { User } from '../../user';
import { NewPaymentMethod } from '../new-payment-method';
import { PaymentInitResult } from '../payment-init-result';
import { PaymentMethod } from '../payment-method';
import { PaymentMethodInitResult } from '../payment-method-init-result';
import { PaymentResult } from '../payment-result';
import { Payment } from '../../payment';

export interface PaymentGateway {
    createPaymentMethod(user: User, info: NewPaymentMethod): Promise<PaymentMethod>;
    initPaymentMethod(user: User, returnUrl?: string): Promise<PaymentMethodInitResult>;
    refreshPaymentMethod(user: User, paymentMethod: PaymentMethod, data?: any): Promise<PaymentMethodInitResult>;
    getCheckoutUrl(user: User, amount: number, currencyCode: string, description: string, reference: string, returnUrl?: string, cancelUrl?: string): Promise<string>;
    initPayment(user: User, paymentMethod: PaymentMethod, amount: number, currencyCode: string, description: string, reference: string): Promise<PaymentInitResult>;
    takePayment(user: User, paymentMethod: PaymentMethod, amount: number, currencyCode: string, reference: string, description?: string, redirectUrl?: string): Promise<PaymentResult>;
    completePayment(user: User, reference: string, data: Record<string, string>): Promise<Payment>;
}