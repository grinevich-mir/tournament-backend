export interface WebsocketConnection {
    id: string;
    region: string;
    skinId: string;
    topics: string[];
    apiId: string;
    userId?: number;
}