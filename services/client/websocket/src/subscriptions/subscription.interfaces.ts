export interface SubscribeRequest {
    action: 'subscribe';
    topic: string;
    topicSettings?: { [key: string]: any };
}

export interface UnsubscribeRequest {
    action: 'unsubscribe';
    topic: string;
}

export type SubscriptionRequest = SubscribeRequest | UnsubscribeRequest;