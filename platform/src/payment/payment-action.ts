export enum PaymentActionType {
    External = 'External',
    Redirect = 'Redirect',
    Retry = 'Retry',
    Prompt = 'Prompt'
}

export interface RedirectPaymentAction {
    type: PaymentActionType.Redirect;
    url: string;
    popup: boolean;
}

export interface ExternalPaymentAction {
    type: PaymentActionType.External;
    data: any;
}

export interface RetryPaymentAction {
    type: PaymentActionType.Retry;
}

export interface PromptPaymentAction {
    type: PaymentActionType.Prompt;
    title?: string;
    message: string;
}

export type PaymentAction = RedirectPaymentAction | ExternalPaymentAction | RetryPaymentAction | PromptPaymentAction;
