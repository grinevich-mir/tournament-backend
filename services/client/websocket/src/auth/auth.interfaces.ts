
export interface LoginRequest {
    action: 'login';
    token: string;
}

export interface LogoutRequest {
    action: 'logout';
}

export type AuthRequest = LoginRequest | LogoutRequest;