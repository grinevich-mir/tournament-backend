import { HttpClient } from '../http-client';
import { SkrillStatusReport, SkrillGetTransactionStatusParams, SkrillStatusReportAction } from '../interfaces';
import { SkrillError } from '../skrill-error';
import { SkrillEnvironment } from '../skrill-environment';
import { SkrillReportResponseDeserialiser } from '../utilities';

export class ReportClient {
    private readonly deserialiser = new SkrillReportResponseDeserialiser();

    constructor(
        private readonly env: SkrillEnvironment,
        private readonly httpClient: HttpClient) {
    }

    public async getTransactionStatus(id: number): Promise<SkrillStatusReport | undefined> {
        return this.performAction<SkrillStatusReport>(id, SkrillStatusReportAction.GetTransactionStatus);
    }

    public async repostTransactionStatus(id: number): Promise<void> {
        return this.performAction<void>(id, SkrillStatusReportAction.RepostTransactionStatus);
    }

    private async performAction<T>(id: number, action: SkrillStatusReportAction): Promise<T | undefined> {
        const data: SkrillGetTransactionStatusParams = {
            mb_trn_id: id,
            action,
            email: this.env.email,
            password: this.env.password
        };

        try {
            const response = await this.httpClient.post<string>(this.env.queryUrl, data);
            return this.deserialiser.run<T>(response);
        } catch (err) {
            if (err instanceof SkrillError)
                if (err.statusCode === 404)
                    return undefined;

            throw err;
        }
    }
}