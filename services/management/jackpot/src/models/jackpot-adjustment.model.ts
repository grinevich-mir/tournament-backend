import { JackpotAdjustmentPurpose } from '@tcom/platform/lib/jackpot';

export interface JackpotAdjustmentModel {
    amount: number;
    purpose: JackpotAdjustmentPurpose;
}