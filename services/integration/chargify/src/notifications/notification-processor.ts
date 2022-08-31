import { Subscription } from '@tcom/platform/lib/subscription';
import { NotificationModel } from '../models';

export interface NotificationProcessor<T extends NotificationModel> {
    process(skinId: string, notification: T, subscription?: Subscription): Promise<void>;
}