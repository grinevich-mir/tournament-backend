import { PaymentwallPingback } from '@tcom/platform/lib/integration/paymentwall';

export interface PingbackProcessor {
    process(pingback: PaymentwallPingback): Promise<void>;
}