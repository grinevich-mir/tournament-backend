import _ from 'lodash';
import { Inject, Singleton } from '../../core/ioc';
import {EthTransaction} from '../../ethTransaction'
import {EthTransactionModel} from './ethTransaction.model'
@Singleton
export class EthTransactionModelMapper {
    constructor() {
    }
    public mapAll(orders: EthTransaction[]): EthTransactionModel[] {
        return orders.map(o => this.map(o));
    }
    public map(source: EthTransactionModel): EthTransaction {
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