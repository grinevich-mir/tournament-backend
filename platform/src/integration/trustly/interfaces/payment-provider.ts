export enum TrustlyPaymentProviderType {
    OnlineBanking = 1,
    ManualElectronicCheck = 2
}

export interface TrustlyPaymentProvider {
    paymentProviderId: string;
    type: TrustlyPaymentProviderType;
    name: string;
    subType?: number;
    country?: string;
    instantPayout?: boolean;
}