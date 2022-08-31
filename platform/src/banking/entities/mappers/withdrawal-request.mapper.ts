import { WithdrawalRequest } from '../../withdrawal-request';
import { WithdrawalRequestEntity } from '../withdrawal-request.entity';
import { Singleton } from '../../../core/ioc';

@Singleton
export class WithdrawalRequestEntityMapper {
    public fromEntity(source: WithdrawalRequestEntity): WithdrawalRequest {
        return {
            id: source.id,
            provider: source.provider,
            providerRef: source.providerRef,
            userId: source.userId,
            amount: source.amount,
            currencyCode: source.currencyCode,
            requesterId: source.requesterId,
            requesterType: source.requesterType,
            status: source.status,
            targetCompletionTime: source.targetCompletionTime,
            completionTime: source.completionTime,
            walletEntryId: source.walletEntryId,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}