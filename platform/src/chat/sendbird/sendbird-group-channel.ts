import { SendBirdUser } from './sendbird-user';
import { SendBirdMessage } from './sendbird-message';

export interface NewSendBirdGroupChannel {
    name?: string;
    channel_url?: string;
    cover_url?: string;
    custom_type?: string;
    data?: string;
    is_distinct?: boolean;
    is_public?: boolean;
    is_super?: boolean;
    is_ephemeral?: boolean;
    access_code?: string;
    hidden_status?: 'unhidden' | 'hidden_allow_auto_unhide' | 'hidden_prevent_auto_unhide';
    inviter_id?: string;
    user_ids?: string[];
    users?: string[];
    strict?: boolean;
    invitation_status?: { [userId: string]: 'joined' | 'invitied_by_friend' | 'invited_by_non_fried' };
    operator_ids?: string[];
}

export interface SendBirdGroupChannelUpdate {
    name?: string;
    cover_url?: string;
    custom_type?: string;
    data?: string;
    is_distinct?: boolean;
    is_public?: boolean;
    access_code?: string;
}

export interface SendBirdGroupChannel {
    name: string;
    channel_url: string;
    cover_url: string;
    custom_type: string;
    data: string;
    is_distinct: boolean;
    is_public: boolean;
    is_super: boolean;
    is_ephemeral: boolean;
    is_access_code_required: boolean;
    member_count: number;
    joined_member_count: number;
    members: SendBirdUser[];
    operators: SendBirdUser[];
    read_receipt: { [key: string]: number };
    last_message: SendBirdMessage;
    created_at: number;
    freeze: boolean;
}