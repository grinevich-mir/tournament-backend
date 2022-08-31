import _ from 'lodash';
import { Inject, Singleton } from '../../../core/ioc';
import {EthTransaction,NewEthTransaction} from '../../ethTransaction'
import {EthTransactionEntity} from '../ethTransaction.entity'
@Singleton
export class EthTransactionEntityMapper {
    constructor() {
    }
    public newToEntity(source: NewEthTransaction): EthTransactionEntity {
        const entity = new EthTransactionEntity();
        entity.completeTime= source.completeTime,
        entity.transectionId=source.transectionId,
        entity.accountId=source.accountId,
        entity.userId=source.userId,
        entity.orderId=source.orderId,
        entity.transactionAmount=source.transactionAmount,
        entity.status=source.status,
        entity.TransactionStatus=source.TransactionStatus,
        entity.TotalAmount=source.TotalAmount,
        entity.TransactionDateTime=source.TransactionDateTime,
        entity.TransactionResponseJson=source.TransactionResponseJson,
        entity.UserRequestJson=source.UserRequestJson,
        entity.transactionLogId=source.transactionLogId
        return entity;
    }
    public fromEntity(source: EthTransactionEntity): EthTransaction {
        return {
            id: source.id,
            completeTime: source.completeTime,
            transectionId:source.transectionId,
            accountId:source.accountId,
            orderId:source.orderId,
            userId:source.userId,
            transactionAmount:source.transactionAmount,
            status:source.status,
            TransactionStatus:source.TransactionStatus,
            TotalAmount:source.TotalAmount,
            TransactionDateTime:source.TransactionDateTime,
            TransactionResponseJson:source.TransactionResponseJson,
             UserRequestJson:source.UserRequestJson,
             transactionLogId:source.transactionLogId
        };
    }

   
}