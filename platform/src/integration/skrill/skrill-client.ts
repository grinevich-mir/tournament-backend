
import { HttpClient } from './http-client';
import { SkrillEnvironment } from './skrill-environment';
import { CheckoutClient, ReportClient } from './clients';

export class SkrillClient {
    private readonly http: HttpClient;

    public readonly checkout: CheckoutClient;
    public readonly report: ReportClient;

    constructor(env: SkrillEnvironment) {
        this.http = new HttpClient();
        this.checkout = new CheckoutClient(env, this.http);
        this.report = new ReportClient(env, this.http);
    }
}