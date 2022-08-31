import { TrustlyClient } from '@tcom/platform/lib/integration/trustly';

export class Context {
    public static client: TrustlyClient;
    public static merchantId: string;
}