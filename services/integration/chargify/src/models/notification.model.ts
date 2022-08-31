import { ChargifyProduct, ChargifySite, ChargifySubscription, ChargifyTransaction } from '@tcom/platform/lib/integration/chargify';

export enum NotificationType {
    PaymentSuccess = 'payment_success',
    PaymentFailure = 'payment_failure',
    RenewalSuccess = 'renewal_success',
    RenewalFailure = 'renewal_failure',
    SignupSuccess = 'signup_success',
    SignupFailure = 'signup_failure',
    SubscriptionProductChange = 'subscription_product_change',
    UpgradeDowngradeSuccess = 'upgrade_downgrade_success',
    UpgradeDowngradeFailure = 'upgrade_downgrade_failure',
    PendingCancellationChange = 'pending_cancellation_change',
    RefundSuccess = 'refund_success',
    RefundFailure = 'refund_failure'
}

interface NotificationBase {
    id: number;
    event: NotificationType;
}

export interface PaymentSuccessNotificationModel extends NotificationBase {
    event: NotificationType.PaymentSuccess;
    payload: {
        site: ChargifySite;
        subscription: ChargifySubscription;
        transaction: ChargifyTransaction;
    };
}

export interface PaymentFailureNotificationModel extends NotificationBase {
    event: NotificationType.PaymentFailure;
    payload: {
        site: ChargifySite;
        subscription: ChargifySubscription;
        transaction: ChargifyTransaction;
    };
}

export interface RenewalSuccessNotificationModel extends NotificationBase {
    event: NotificationType.RenewalSuccess;
    payload: {
        site: ChargifySite;
        subscription: ChargifySubscription;
        transaction: ChargifyTransaction;
    };
}

export interface RenewalFailureNotificationModel extends NotificationBase {
    event: NotificationType.RenewalFailure;
    payload: {
        site: ChargifySite;
        subscription: ChargifySubscription;
        transaction: ChargifyTransaction;
    };
}

export interface SignupSuccessNotificationModel extends NotificationBase {
    event: NotificationType.SignupSuccess;
    payload: {
        site: ChargifySite;
        subscription: ChargifySubscription;
    };
}

export interface SignupFailureNotificationModel extends NotificationBase {
    event: NotificationType.SignupFailure;
    payload: {
        site: ChargifySite;
        subscription: ChargifySubscription;
    };
}

export interface SubscriptionProductChangeNotificationModel extends NotificationBase {
    event: NotificationType.SubscriptionProductChange;
    payload: {
        site: ChargifySite;
        subscription: ChargifySubscription;
        previous_product: ChargifyProduct;
    };
}

export interface UpgradeDowngradeSuccessNotificationModel extends NotificationBase {
    event: NotificationType.UpgradeDowngradeSuccess;
    payload: {
        site: ChargifySite;
        subscription: ChargifySubscription;
        previous_product: ChargifyProduct;
    };
}

export interface UpgradeDowngradeFailureNotificationModel extends NotificationBase {
    event: NotificationType.UpgradeDowngradeFailure;
    payload: {
        site: ChargifySite;
        subscription: ChargifySubscription;
        previous_product: ChargifyProduct;
    };
}

export interface PendingCancellationChangeNotificationModel extends NotificationBase {
    event: NotificationType.PendingCancellationChange;
    payload: {
        site: ChargifySite;
        subscription: ChargifySubscription;
    };
}

export interface RefundSuccessNotificationModel extends NotificationBase {
    event: NotificationType.RefundSuccess;
    payload: {
        refund_id: string;
        amount_in_cents: string;
        customer_id: string;
        customer_email: string;
        customer_name: string;
        customer_reference: string;
        gameway_transaction_id: string;
        gateway_order_id: string;
        masked_card_number?: string;
        memo: string;
        payment_amount_in_cents: string;
        payment_id: string;
        site: ChargifySite;
        subscription_id: string;
        timestamp: string;
        currency: string;
        subscription?: ChargifySubscription;
    };
}

export type NotificationModel = PaymentSuccessNotificationModel |
                           PaymentFailureNotificationModel |
                           RenewalSuccessNotificationModel |
                           RenewalFailureNotificationModel |
                           SignupSuccessNotificationModel |
                           SignupFailureNotificationModel |
                           SubscriptionProductChangeNotificationModel |
                           UpgradeDowngradeSuccessNotificationModel |
                           UpgradeDowngradeFailureNotificationModel |
                           PendingCancellationChangeNotificationModel |
                           RefundSuccessNotificationModel;