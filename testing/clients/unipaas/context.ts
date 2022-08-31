import { UnipaasClient } from '@tcom/platform/lib/integration/unipaas';

export class Context {
    public static client: UnipaasClient;
    public static sessionToken: string;
}