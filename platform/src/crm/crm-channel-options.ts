export interface CRMChannelOptOuts {
    [key: string]: boolean;
}

export interface CRMChannelOptions {
    enabled?: boolean;
    optOuts?: CRMChannelOptOuts;
}