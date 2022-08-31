import { Singleton } from 'typescript-ioc';
import { ReferralCommissionRateEntity } from '../referral-commission-rate.entity';
import { ReferralCommissionRate, NewReferralCommissionRate, ReferralCommissionRateUpdate } from '../../referral-commission-rate';

@Singleton
export class ReferralCommissionGroupEntityMapper {
    public fromEntity(source: ReferralCommissionRateEntity): ReferralCommissionRate {
        return {
            level: source.level,
            groupId: source.groupId,
            rate: source.rate,
            minAmount: source.minAmount,
            maxAmount: source.maxAmount || undefined,
            enabled: source.enabled,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public newToEntity(groupId: number, level: number, source: NewReferralCommissionRate): ReferralCommissionRateEntity {
        const entity = new ReferralCommissionRateEntity();
        entity.level = level;
        entity.groupId = groupId;
        entity.rate = source.rate;
        entity.minAmount = source.minAmount || 0;
        entity.maxAmount = source.maxAmount;
        return entity;
    }

    public updateToEntity(groupId: number, level: number, source: ReferralCommissionRateUpdate): ReferralCommissionRateEntity {
        const entity = new ReferralCommissionRateEntity();
        entity.level = level;
        entity.groupId = groupId;
        entity.rate = source.rate;
        entity.minAmount = source.minAmount || 0;
        entity.maxAmount = source.maxAmount;
        entity.enabled = source.enabled;
        return entity;
    }
}