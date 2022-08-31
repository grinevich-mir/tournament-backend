import { Singleton, Inject } from '../core/ioc';
import _ from 'lodash';
import { TransferBuilder, InitialTransferBuilder } from './transfer';
import { TransferProcessor } from './transfer/transfer-processor';
import { LogClass } from '../core/logging';

@Singleton
@LogClass({ result: false })
export class Ledger {
    constructor(@Inject private readonly processor: TransferProcessor) {
    }

    public transfer(amount: number, currencyCode: string): InitialTransferBuilder {
        return new TransferBuilder(this.processor, amount, currencyCode);
    }
}