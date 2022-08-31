import { SendBirdApiClient } from './sendbird-api.client';
import { Inject, Singleton } from '../../../core/ioc';
import { SendBirdOpenChannel, NewSendBirdOpenChannel, SendBirdOpenChannelUpdate } from '../sendbird-open-channel';
import querystring from 'querystring';
import { SendBirdMessage, NewSendBirdMessage } from '../sendbird-message';
import { LogClass } from '../../../core/logging';

@Singleton
@LogClass()
export class SendBirdOpenChannelClient {
    private readonly basePath = 'open_channels';

    constructor(
        @Inject private readonly client: SendBirdApiClient) {
        }

    public async get(channelUrl: string): Promise<SendBirdOpenChannel | undefined> {
        try {
            const path = `${this.basePath}/${channelUrl}`;
            return await this.client.get<SendBirdOpenChannel>(path);
        } catch (err) {
            if (err.code === 400201)
                return undefined;

            throw err;
        }
    }

    public async create(channel: NewSendBirdOpenChannel): Promise<SendBirdOpenChannel> {
        const path = this.basePath;
        return this.client.post<SendBirdOpenChannel>(path, channel);
    }

    public async update(channelUrl: string, update: SendBirdOpenChannelUpdate): Promise<SendBirdOpenChannel> {
        const path = `${this.basePath}/${querystring.escape(channelUrl)}`;
        return this.client.put<SendBirdOpenChannel>(path, update);
    }

    public async delete(channelUrl: string): Promise<void> {
        const path = `${this.basePath}/${querystring.escape(channelUrl)}`;
        return this.client.delete(path);
    }

    public async freeze(channelUrl: string): Promise<void> {
        const path = `${this.basePath}/${querystring.escape(channelUrl)}/freeze`;
        const data = {
            freeze: true
        };
        return this.client.put(path, data);
    }

    public async unfreeze(channelUrl: string): Promise<void> {
        const path = `${this.basePath}/${querystring.escape(channelUrl)}/freeze`;
        const data = {
            freeze: false
        };
        return this.client.put(path, data);
    }

    public async inviteMembers(channelUrl: string, ...userIds: string[]): Promise<SendBirdOpenChannel> {
        const path = `${this.basePath}/${querystring.escape(channelUrl)}/invite`;
        const data = {
            user_ids: userIds
        };
        return this.client.post<SendBirdOpenChannel>(path, data);
    }

    public async removeMembers(channelUrl: string, ...userIds: string[]): Promise<void> {
        const path = `${this.basePath}/${querystring.escape(channelUrl)}/leave`;
        const data = {
            user_ids: userIds
        };
        return this.client.put(path, data);
    }

    public async removeAllMembers(channelUrl: string): Promise<void> {
        const path = `${this.basePath}/${querystring.escape(channelUrl)}/leave`;
        const data = {
            should_leave_all: true
        };
        return this.client.put(path, data);
    }

    public async sendMessage(channelUrl: string, message: NewSendBirdMessage): Promise<SendBirdMessage> {
        const path = `${this.basePath}/${querystring.escape(channelUrl)}/messages`;
        return this.client.post(path, message);
    }
}