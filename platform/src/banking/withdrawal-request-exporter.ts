import { WithdrawalRequestExportResult } from './withdrawal-request-export-result';
import { WithdrawalRequest } from './withdrawal-request';

export interface WithdrawalRequestExporter {
    export(requests: WithdrawalRequest[]): WithdrawalRequestExportResult;
}