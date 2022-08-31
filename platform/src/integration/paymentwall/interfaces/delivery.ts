export interface DeliveryConfirmationParams {
    payment_id: string;
    merchant_reference_id: string;
    type: 'physical' | 'digital';
    status: 'delivered' | 'refund_issued';
    estimated_delivery_datetime?: string;
    estimated_update_datetime?: string;
    reason: string;
    refundable: boolean;
    details?: string;
    attachments?: any;
    is_test?: 1 | 0;
    'shipping_address[email]': string;
}

export interface DeliveryConfirmation {
    success: boolean;
    error: any;
    error_code: number;
    notices: any;
}