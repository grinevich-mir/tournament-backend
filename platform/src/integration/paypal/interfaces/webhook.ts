import { PayPalLinkDescription } from './common';

export interface PayPalWebhookEventTypeDescriptor {
    name: string;
    description?: string;
    status?: string;
}

export interface PayPalWebhook {
    id: string;
    url: string;
    event_types: PayPalWebhookEventTypeDescriptor[];
    links: PayPalLinkDescription[];
}

export interface PayPalWebhookCreateParams {
    url: string;
    event_types: PayPalWebhookEventTypeDescriptor[];
}

export interface PayPalWebhookPatchParams {
    op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
    path: string;
    value: string;
    from: string;
}

export enum PayPalWebhookVerificationStatus {
    Success = 'SUCCESS',
    Failure = 'FAILURE'
}

export interface PayPalWebhookVerificationParams {
    auth_algo: string;
    cert_url: string;
    transmission_id: string;
    transmission_sig: string;
    transmission_time: string;
    webhook_id: string;
    webhook_event: PayPalWebhookEvent;
}

export interface PayPalWebhookEvent {
    id: string;
    create_time: string;
    resource_type: string;
    event_version: string;
    event_type: PayPalWebhookEventType;
    summary: string;
    resource_version: string;
    resource: any;
    status: string;
    links: PayPalLinkDescription[];
}

export enum PayPalWebhookEventType {
    CheckoutOrderApproved = 'CHECKOUT.ORDER.APPROVED',
    PaymentCaptureRefunded = 'PAYMENT.CAPTURE.REFUNDED',
    PaymentCaptureReversed = 'PAYMENT.CAPTURE.REVERSED',
    PaymentCaptureCompleted = 'PAYMENT.CAPTURE.COMPLETED',
    PaymentCaptureDenied = 'PAYMENT.CAPTURE.DENIED',
    PaymentCapturePending = 'PAYMENT.CAPTURE.PENDING'
}