export type UnipaasWebhookName = 'authorization/update' | 'ewallet/create' | 'payout/generate' | 'payout/confirm' | 'payout/cancel' | 'payout/complete';

export interface UnipaasWebhook {
    id: number;
    merchantId: string;
    sellerId: string;
    webhookName: UnipaasWebhookName;
    validity: string;
    email: string;
    url: string;
}

export interface UnipaasCreateWebhookParams {
    webhookName: UnipaasWebhookName;
    email: string;
    url: string;
}

export interface UnipaasUpdateWebhookParams extends Omit<UnipaasCreateWebhookParams, 'webhookName'> {
    validity: string;
}