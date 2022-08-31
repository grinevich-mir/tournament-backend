import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { ChatManager } from '@tcom/platform/lib/chat';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';

interface FreezeChannelEvent {
    channelName: string;
}

@Singleton
@LogClass()
class FreezeChannelHandler {
    constructor(
        @Inject private readonly chatManager: ChatManager) {
    }

    public async execute(event: FreezeChannelEvent): Promise<void> {
        const channelName = event.channelName;
        try {
            const channel = await this.chatManager.getChannel(channelName);

            if (!channel) {
                Logger.warn(`Channel ${channelName} does not exist.`);
                return;
            }

            await this.chatManager.freezeChannel(channelName);
            Logger.info(`Channel ${channelName} frozen.`);
        } catch (err) {
            Logger.error(`Could not freeze channel ${channelName}`, err);
        }
    }
}

export const freezeChannel = lambdaHandler((event: FreezeChannelEvent) => IocContainer.get(FreezeChannelHandler).execute(event));