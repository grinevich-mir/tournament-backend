import { SendBirdUser } from './sendbird-user';

export interface NewSendBirdOpenChannel {
    name?: string;
    channel_url?: string;
    cover_url?: string;
    custom_type?: string;
    data?: string;
    is_ephemeral?: boolean;
    operator_ids?: string[];
}

export interface SendBirdOpenChannelUpdate {
    name?: string;
    channel_url?: string;
    cover_url?: string;
    custom_type?: string;
    data?: string;
    is_ephemeral?: boolean;
    operator_ids?: string[];
}

export interface SendBirdOpenChannel {
    name: string;
    channel_url: string;
    cover_url: string;
    custom_type: string;
    data: string;
    is_ephemeral: boolean;
    participant_count: number;
    max_length_message: number;
    operators: SendBirdUser[];
    created_at: number;
    freeze: boolean;
}