import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { Config, ParameterStore } from '@tcom/platform/lib/core';
import { SkrillStatusReport } from '@tcom/platform/lib/integration/skrill';
import { SkrillCrypto, SkrillReportDeserialiser } from '@tcom/platform/lib/integration/skrill/utilities';

@Singleton
@LogClass()
export class NotificationVerifier {
    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly crypto: SkrillCrypto,
        @Inject private readonly deserialiser: SkrillReportDeserialiser) {
    }

    public async verify(body: string | null): Promise<SkrillStatusReport> {
        if (!body)
            throw new Error('Body cannot be empty.');

        const report = this.deserialiser.deserialise<SkrillStatusReport>(body);

        if (!report)
            throw new Error('Failed to deserialise Skrill status report.');

        Logger.info('Processing Skrill Status Report:', report);

        const secret = await this.parameterStore.get(`/${Config.stage}/integration/skrill/secret`, true, true);
        const secretHash = this.crypto.hash(secret);
        const signatureFields = `${report.merchant_id}${report.transaction_id}${secretHash}${report.mb_amount}${report.mb_currency}${report.status}`;
        const expectedSignature = this.crypto.hash(signatureFields);

        if (expectedSignature !== report.md5sig) {
            Logger.warn('Invalid Skrill status report signature.', [
                report.md5sig,
                expectedSignature
            ]);

            throw new Error('Invalid Skrill status report signature.');
        }

        Logger.info('Skrill Status Report Verified:', report);

        return report;
    }
}