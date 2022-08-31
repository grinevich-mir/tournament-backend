import { WidgetSignature } from 'paymentwall';

export class PaymentwallRequestSigner {
    public sign(secretKey: string, parameters?: Record<string, string>, version: number = 2): string {
        return WidgetSignature.calculateSignature(parameters, secretKey, version);
    }
}