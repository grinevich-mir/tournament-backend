import { TransactionPurpose } from '@tcom/platform/lib/banking';

/**
 * @example
 * {
 *  "amount": 5,
 *  "purpose": "Deposit/Adjustment",
 *  "memo": "Add/Remove 5 diamonds",
 *  "userId": 1,
 * }
 */
export interface TransferModel {
    amount: number;
    purpose: TransactionPurpose;
    memo: string;
    userId: number;
}
