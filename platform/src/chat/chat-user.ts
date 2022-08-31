
export interface NewChatUser {
    userId: number;
    displayName: string;
    avatarUrl: string;
    country: string;
    level: number;
}

export interface ChatUserUpdate {
    displayName?: string;
    avatarUrl?: string;
    country?: string;
    level?: number;
    is_active?: boolean;
}

export interface ChatUser extends NewChatUser {
    userId: number;
    accessToken: string;
}