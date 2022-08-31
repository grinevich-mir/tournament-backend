import { Singleton, Inject } from '../../../core/ioc';
import { SendBirdUser, NewSendBirdUser, SendBirdUserUpdate } from '../sendbird-user';
import querystring from 'querystring';
import { SendBirdApiClient } from './sendbird-api.client';
import { LogClass } from '../../../core/logging';


@Singleton
@LogClass()
export class SendBirdUserClient {
    private readonly basePath = 'users';

    constructor(
        @Inject private readonly client: SendBirdApiClient) {
        }

    public async get(id: string): Promise<SendBirdUser> {
        const path = `${this.basePath}/${querystring.escape(id)}`;
        return this.client.get<SendBirdUser>(path);
    }

    public async create(user: NewSendBirdUser): Promise<SendBirdUser> {
        const path = this.basePath;
        return this.client.post<SendBirdUser>(path, user);
    }

    public async update(id: string, update: SendBirdUserUpdate): Promise<SendBirdUser> {
        const path = `${this.basePath}/${querystring.escape(id)}`;
        return this.client.put<SendBirdUser>(path, update);
    }

    public async delete(id: string): Promise<void> {
        const path = `${this.basePath}/${querystring.escape(id)}`;
        return this.client.delete(path);
    }

    public async updateMetadata(id: string, metadata: { [key: string]: string }, upsert: boolean = false): Promise<void> {
        const path = `${this.basePath}/${querystring.escape(id)}/metadata`;
        await this.client.put(path, {
            metadata,
            upsert
        });
    }
}