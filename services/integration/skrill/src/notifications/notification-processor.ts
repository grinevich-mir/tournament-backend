import { SkrillStatusReport } from '@tcom/platform/lib/integration/skrill';

export interface NotificationProcessor {
    process(report: SkrillStatusReport): Promise<void>;
}