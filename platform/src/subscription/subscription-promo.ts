import { SubscriptionPeriod } from './subscription-period';

export interface SubscriptionPromo {
    id: number;
    skinId: string;
    cycles: number;
    period: SubscriptionPeriod;
    expireIn: number;
    onDowngrade: boolean;
    onCancellation: boolean;
    enabled: boolean;
    createTime: Date;
    updateTime: Date;
}