import { SubscriptionTierVariant } from './subscription-tier-variant';

export interface SubscriptionTier {
     id: number;
     code: string;
     level: number;
     name: string;
     skinId: string;
     variants: SubscriptionTierVariant[];
     enabled: boolean;
     createTime: Date;
     updateTime: Date;
}