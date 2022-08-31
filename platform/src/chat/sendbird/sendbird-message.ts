import { SendBirdUser } from './sendbird-user';

interface SendBirdMessageBase {
    message_id: number;
    type: string;
    custom_type: string;
    channel_url: string;
    mention_type: 'users' | 'channel';
    mentioned_users: string[];
    is_removed: boolean;
    message: string;
    data: string;
    created_at: number;
    updated_at: number;
}

export interface SendBirdTextMessage extends SendBirdMessageBase {
    type: 'MESG';
    user: SendBirdUser;
    translations: { [lang: string]: string };
}

export interface SendBirdFileMessage extends SendBirdMessageBase {
    type: 'FILE';
    user: SendBirdUser;
    file: {
        url: string;
        name: string;
        type: string;
        size: number;
        data: string;
    };
    thumbnails: string[];
    requires_auth: boolean;
}

export interface SendBirdAdminMessage extends SendBirdMessageBase {
    type: 'ADMM';
}

export type SendBirdMessage = SendBirdTextMessage | SendBirdFileMessage | SendBirdAdminMessage;

interface NewSendBirdMessageBase {
    message_type: string;
    message: string;
    custom_type?: string;
    mention_type?: 'users' | 'channel';
    mentioned_users?: string[];
    data?: string;
    send_push?: boolean;
    sorted_metaarray?: { [key: string]: string };
    created_at?: number;
    dedup_id?: string;
}

export interface NewSendBirdTextMessage extends NewSendBirdMessageBase {
    message_type: 'MESG';
    user_id: string;
    mark_as_read?: boolean;
}

export interface NewSendBirdFileMessage extends NewSendBirdMessageBase {
    message_type: 'FILE';
    user_id: string;
    url: string;
    file_name?: string;
    file_size?: string;
    file_type?: string;
    thumbnails?: string[];
    mark_as_read?: boolean;
}

export interface NewSendBirdAdminMessage extends NewSendBirdMessageBase {
    message_type: 'ADMM';
    is_silent?: boolean;
}

export type NewSendBirdMessage = NewSendBirdTextMessage | NewSendBirdFileMessage | NewSendBirdAdminMessage;