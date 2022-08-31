import { Inject, Singleton } from '../core/ioc';
import { ChatChannel } from './chat-channel';
import { ChatUserUpdate, ChatUser, NewChatUser } from './chat-user';
import { SendBirdUserClient, SendBirdOpenChannelClient, NewSendBirdOpenChannel, SendBirdUserUpdate, NewSendBirdUser, SendBirdUser } from './sendbird';
import { NewSendBirdMessage } from './sendbird/sendbird-message';
import Logger, { UserLog, LogClass } from '../core/logging';

@Singleton
@LogClass()
export class ChatManager {
    constructor(
        @Inject private readonly userClient: SendBirdUserClient,
        @Inject private readonly openChannelClient: SendBirdOpenChannelClient,
        @Inject private readonly userLog: UserLog) {
    }

    public async getUser(id: string): Promise<ChatUser> {
        const user = await this.userClient.get(id);
        return this.mapUser(user);
    }

    public async createUser(newUser: NewChatUser): Promise<ChatUser> {
        return this.userLog.handle(newUser.userId, 'Chat:User:Create', async (logData) => {
            logData.displayName = newUser.displayName;
            logData.avatarUrl = newUser.avatarUrl;

            if (newUser.country)
                logData.country = newUser.country;

            const newSendBirdUser: NewSendBirdUser = {
                user_id: newUser.userId.toString(),
                nickname: newUser.displayName,
                profile_url: newUser.avatarUrl,
                metadata: {
                    country: newUser.country,
                    level: newUser.level.toString()
                },
                issue_access_token: true
            };

            const sendBirdUser = await this.userClient.create(newSendBirdUser);
            return this.mapUser(sendBirdUser);
        });
    }

    public async updateUser(id: number, update: ChatUserUpdate): Promise<void> {
        return this.userLog.handle(id, 'Chat:User:Update', async (logData) => {
            const userUpdate: SendBirdUserUpdate = {};

            if (update.displayName) {
                logData.displayName = update.displayName;
                userUpdate.nickname = update.displayName;
            }

            if (update.avatarUrl) {
                logData.avatarUrl = update.avatarUrl;
                userUpdate.profile_url = update.avatarUrl;
            }

            if (update.is_active !== undefined) {
                logData.is_active = update.is_active;
                userUpdate.is_active = update.is_active;
            }

            if (Object.keys(userUpdate).length > 0)
                await this.userClient.update(id.toString(), userUpdate);

            const metadata: { [key: string]: string; } = {};

            if (update.country) {
                logData.country = update.country;
                metadata.country = update.country;
            }

            if (update.level !== undefined) {
                logData.level = update.level;
                metadata.level = update.level.toString();
            }

            if (Object.keys(metadata).length > 0)
                await this.userClient.updateMetadata(id.toString(), metadata, true);
        });
    }

    public async deleteUser(id: string): Promise<void> {
        await this.userClient.delete(id);
    }

    public async addUserToChannel(channelName: string, id: string): Promise<void> {
        // NOTE: Not supported when using open channels.
        // await this.groupChannelClient.inviteMembers(channelName, id);
    }

    public async removeUserFromChannel(channelName: string, id: string): Promise<void> {
        // NOTE: Not supported when using open channels.
        // await this.groupChannelClient.removeMembers(channelName, id);
    }

    public async getChannel(name: string): Promise<ChatChannel | undefined> {
        const channel = await this.openChannelClient.get(name);

        if (!channel)
            return undefined;

        return {
            name: channel.channel_url,
            topic: channel.name,
            frozen: channel.freeze
        };
    }

    public async createChannel(name: string, topic: string): Promise<ChatChannel> {
        Logger.info(`Creating channel ${name}...`);
        const newChannel: NewSendBirdOpenChannel = {
            channel_url: name,
            name: topic
        };
        const channel = await this.openChannelClient.create(newChannel);

        return {
            name: channel.channel_url,
            topic: channel.name,
            frozen: channel.freeze
        };
    }

    public async deleteChannel(name: string): Promise<void> {
        Logger.info(`Deleting channel ${name}...`);
        await this.openChannelClient.delete(name);
    }

    public async freezeChannel(name: string): Promise<void> {
        Logger.info(`Freezing channel ${name}`);
        await this.openChannelClient.freeze(name);
    }

    public async unfreezeChannel(name: string): Promise<void> {
        Logger.info(`Unfreezing channel ${name}`);
        await this.openChannelClient.unfreeze(name);
    }

    public async sendMessage(channelName: string, userId: number, body: string): Promise<void> {
        const message: NewSendBirdMessage = {
            message_type: 'MESG',
            user_id: userId.toString(),
            message: body
        };
        await this.openChannelClient.sendMessage(channelName, message);
    }

    private mapUser(user: SendBirdUser): ChatUser {
        return {
            userId: Number(user.user_id),
            displayName: user.nickname,
            avatarUrl: user.profile_url,
            country: user.metadata?.country,
            level: user.metadata && user.metadata.level ? Number(user.metadata.level) : 0,
            accessToken: user.access_token
        };
    }
}