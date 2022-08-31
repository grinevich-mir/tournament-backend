import { WalletEntry } from '../../wallet-entry';
import { WalletEntryEntity } from '../wallet-entry.entity';
import { Singleton, Inject } from '../../../core/ioc';
import { WalletTransactionEntityMapper } from './wallet-transaction.mapper';

@Singleton
export class WalletEntryEntityMapper {
    constructor(@Inject private readonly transactionEntityMapper: WalletTransactionEntityMapper) {

    }

    public fromEntity(source: WalletEntryEntity): WalletEntry {
        const entry: WalletEntry = {
            id: source.id,
            purpose: source.purpose,
            requesterId: source.requesterId,
            requesterType: source.requesterType,
            externalRef: source.externalRef,
            linkedEntryId: source.linkedEntryId,
            memo: source.memo,
            createTime: source.createTime
        };

        if (source.transactions)
            entry.transactions = source.transactions.map(t => this.transactionEntityMapper.fromEntity(t));

        return entry;
    }
}