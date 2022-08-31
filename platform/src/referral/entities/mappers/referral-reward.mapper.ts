import { Singleton, Inject } from '../../../core/ioc';
import { ReferralRewardEntity, DiamondsReferralRewardEntity, CommissionReferralRewardEntity } from '../referral-reward.entity';
import { ReferralReward, NewReferralReward } from '../../referral-reward';
import { ReferralRewardType } from '../../referral-reward-type';
import { ReferralEntityMapper } from './referral.mapper';

@Singleton
export class ReferralRewardEntityMapper {
    constructor(@Inject private readonly referralMapper: ReferralEntityMapper) {
    }

    public fromEntity(source: ReferralRewardEntity): ReferralReward {
        if (source instanceof DiamondsReferralRewardEntity)
            return {
                id: source.id,
                type: ReferralRewardType.Diamonds,
                event: source.event,
                userId: source.userId,
                referralId: source.referralId,
                referral: this.referralMapper.fromEntity(source.referral),
                amount: source.amount,
                walletEntryId: source.walletEntryId,
                createTime: source.createTime
            };

        if (source instanceof CommissionReferralRewardEntity)
            return {
                id: source.id,
                type: ReferralRewardType.Commission,
                event: source.event,
                userId: source.userId,
                referralId: source.referralId,
                referral: this.referralMapper.fromEntity(source.referral),
                level: source.level,
                rate: source.rate,
                sourceAmount: source.sourceAmount,
                sourceType: source.sourceType,
                sourceId: source.sourceId,
                commission: source.commission,
                walletEntryId: source.walletEntryId,
                createTime: source.createTime
            };

        throw new Error(`Unsupported referral reward type ${source.type}.`);
    }

    public newToEntity(source: NewReferralReward): ReferralRewardEntity {
        switch(source.type) {
            case ReferralRewardType.Diamonds:
                const diamondsEntity = new DiamondsReferralRewardEntity();
                diamondsEntity.amount = source.amount;
                diamondsEntity.walletEntryId = source.walletEntryId;
                return this.mapBaseEntity(source, diamondsEntity);

            case ReferralRewardType.Commission:
                const commissionEntity = new CommissionReferralRewardEntity();
                commissionEntity.level = source.level;
                commissionEntity.sourceAmount = source.sourceAmount;
                commissionEntity.sourceType = source.sourceType;
                commissionEntity.sourceId = source.sourceId;
                commissionEntity.rate = source.rate;
                commissionEntity.commission = source.commission;
                commissionEntity.walletEntryId = source.walletEntryId;
                return this.mapBaseEntity(source, commissionEntity);
        }
    }

    private mapBaseEntity(source: NewReferralReward, target: ReferralRewardEntity): ReferralRewardEntity {
        target.type = source.type;
        target.event = source.event;
        target.userId = source.userId;
        target.referralId = source.referralId;
        return target;
    }
}