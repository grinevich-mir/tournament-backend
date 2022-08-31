interface BaseTarget {
    region?: string;
}

export interface UserTarget extends BaseTarget {
    type: 'User';
    userId: number;
}

export interface UsersTarget extends BaseTarget {
    type: 'Users';
    userIds: number[];
}

export interface TopicsTarget extends BaseTarget {
    type: 'Topics';
    topics: string[];
}

export interface ConnectionTarget extends BaseTarget {
    type: 'Connection';
    connectionId: string;
}

export interface BroadcastTarget extends BaseTarget {
    type: 'Broadcast';
}

export type MessageTarget = UserTarget | UsersTarget | TopicsTarget | ConnectionTarget | BroadcastTarget;