export interface AdminLogMessage {
    userId: string;
    resource: string;
    action: string;
    data: { [name: string]: string | number | boolean | any[]; };
    timestamp: Date;
    additionalData?: { [name: string]: string | number | boolean | any[]; };
}