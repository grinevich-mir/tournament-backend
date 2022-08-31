import { SendBirdSessionToken } from './sendbird-session-token';

export interface NewSendBirdUser {
    user_id: string;
    nickname: string;
    profile_url: string;
    issue_access_token?: boolean;
    issue_session_token?: boolean;
    session_token_expires_at?: number;
    metadata?: { [key: string]: string };
}

export interface SendBirdUserUpdate {
    nickname?: string;
    profile_url?: string;
    issue_access_token?: boolean;
    issue_session_token?: boolean;
    session_token_expires_at?: number;
    is_active?: boolean;
    last_seen_at?: number;
    discovery_keys?: string[];
    leave_all_when_deactivated?: boolean;
}

export interface SendBirdUser {
    user_id: string;
    nickname: string;
    profile_url: string;
    access_token: string;
    session_tokens: SendBirdSessionToken[];
    is_online: boolean;
    is_active: boolean;
    last_seen_at: number;
    discovery_keys: string[];
    has_ever_logged_in: boolean;
    metadata: { [key: string]: string };
}