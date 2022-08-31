import { Singleton, Inject } from '../core/ioc';
import { NewContact, ContactUpdate } from './contact';
import AWS from 'aws-sdk';
import { DEFAULT_REGION, ParameterStore, Config } from '../core';
import { CRMChannel } from './crm-channel';
import { CRMTemplateName } from './crm-template-name';
import { EndpointBatchItem, EndpointUser, MapOfEventsBatch, MapOfListOf__string, UpdateEndpointRequest } from 'aws-sdk/clients/pinpoint';
import _ from 'lodash';
import Logger, { LogClass } from '../core/logging';
import uuid from 'uuid/v4';
import { CRMEmailTemplate, CRMSmsTemplate } from './crm-template';
import { CRMChannelOptions } from './crm-channel-options';
import { CRMEventData } from './crm-event-data';

type EventAttributes = { [key: string]: string };

export interface CRMEventSource {
    userId: number;
    data?: CRMEventData;
}

@Singleton
@LogClass()
export class CRMManager {
    constructor(
        @Inject private readonly parameterStore: ParameterStore) {
        }

    public async addContact(contact: NewContact): Promise<void> {
        const pinpoint = new AWS.Pinpoint({ region: DEFAULT_REGION });
        const endpoints: EndpointBatchItem[] = [];
        const user = this.createEndpointUser(contact.userId, contact);

        endpoints.push(this.createEndpoint(contact.userId, CRMChannel.Email, user, contact.email));

        if (contact.sms)
            endpoints.push(this.createEndpoint(contact.userId, CRMChannel.SMS, user, contact.sms));

        for (const endpoint of endpoints) {
            endpoint.EndpointStatus = 'ACTIVE';
            endpoint.OptOut = 'NONE';
        }

        const appId = await this.getAppId();

        const result = await pinpoint.updateEndpointsBatch({
            ApplicationId: appId,
            EndpointBatchRequest: {
                Item: endpoints
            }
        }).promise();

        Logger.debug('Result', result);
    }

    public async updateContact(userId: number, contact: ContactUpdate): Promise<void> {
        const pinpoint = new AWS.Pinpoint({ region: DEFAULT_REGION });
        const endpoints: EndpointBatchItem[] = [];
        const user = this.createEndpointUser(userId, contact);

        endpoints.push(this.createEndpoint(userId, CRMChannel.Email, user, contact.email));

        if (contact.sms)
            endpoints.push(this.createEndpoint(userId, CRMChannel.SMS, user, contact.sms));

        const appId = await this.getAppId();

        const result = await pinpoint.updateEndpointsBatch({
            ApplicationId: appId,
            EndpointBatchRequest: {
                Item: endpoints
            }
        }).promise();

        Logger.debug('Result', result);
    }

    public async setChannelOptions(userId: number, channel: CRMChannel, options: CRMChannelOptions): Promise<void> {
        const pinpoint = new AWS.Pinpoint({ region: DEFAULT_REGION });

        const appId = await this.getAppId();

        const request: UpdateEndpointRequest = {
            ApplicationId: appId,
            EndpointId: this.formatEndpointId(userId, channel),
            EndpointRequest: {}
        };

        const attributes: MapOfListOf__string = {};

        if (options.enabled !== undefined) {
            request.EndpointRequest.OptOut = options.enabled ? 'NONE' : 'ALL';
            attributes.Enabled = [options.enabled.toString()];
        }

        if (options.optOuts)
            for (const messageType of Object.keys(options.optOuts))
                attributes[`OptOut_${messageType}`] = [(!options.optOuts[messageType]).toString()];

        if (Object.keys(attributes).length > 0)
            request.EndpointRequest.Attributes = attributes;

        await pinpoint.updateEndpoint(request).promise();
    }

    public async deleteContact(userId: number, channel?: CRMChannel): Promise<void> {
        const pinpoint = new AWS.Pinpoint({ region: DEFAULT_REGION });

        const appId = await this.getAppId();

        if (channel) {
            await pinpoint.deleteEndpoint({
                ApplicationId: appId,
                EndpointId: this.formatEndpointId(userId, channel)
            }).promise();
            return;
        }

        await pinpoint.deleteUserEndpoints({
            ApplicationId: appId,
            UserId: userId.toString()
        }).promise();
    }

    public async getEmailTemplate(skinId: string, name: CRMTemplateName): Promise<CRMEmailTemplate> {
        const pinpoint = new AWS.Pinpoint({ region: DEFAULT_REGION });

        const response = await pinpoint.getEmailTemplate({
            TemplateName: this.formatTemplateName(skinId, name)
        }).promise();

        return {
            name,
            subject: response.EmailTemplateResponse.Subject,
            html: response.EmailTemplateResponse.HtmlPart,
            text: response.EmailTemplateResponse.TextPart
        };
    }

    public async getSmsTemplate(skinId: string, name: CRMTemplateName): Promise<CRMSmsTemplate> {
        const pinpoint = new AWS.Pinpoint({ region: DEFAULT_REGION });

        const response = await pinpoint.getSmsTemplate({
            TemplateName: this.formatTemplateName(skinId, name)
        }).promise();

        return {
            name,
            body: response.SMSTemplateResponse.Body
        };
    }

    public async addEvent(userId: number, eventType: string, data?: CRMEventData): Promise<void> {
        await this.addEvents([{
            userId,
            data
        }], eventType, data);
    }

    public async addEvents(sources: CRMEventSource[], eventType: string, data?: CRMEventData): Promise<void> {
        const pinpoint = new AWS.Pinpoint({ region: DEFAULT_REGION });
        const appId = await this.getAppId();

        const batches = _.chunk(sources, 100);

        for (const batch of batches) {
            const events: MapOfEventsBatch = {};

            for (const source of batch) {
                const endpointId = this.formatEndpointId(source.userId, CRMChannel.Email);
                const sourceData = { ...data, ...source.data };
                const attributes = this.mapEventData(sourceData);

                events[endpointId] = {
                    Endpoint: {},
                    Events: {
                        [uuid()]:
                        {
                            EventType: eventType,
                            Attributes: attributes,
                            Timestamp: new Date().toISOString()
                        }
                    }
                };
            }

            await pinpoint.putEvents({
                ApplicationId: appId,
                EventsRequest: {
                    BatchItem: events
                }
            }).promise();
        }
    }

    private createEndpointUser(userId: number, contact: ContactUpdate): EndpointUser {
        const excludedProperties = ['email', 'sms'];
        const userAttributes: { [key: string]: string[] } = {};

        for (const key of Object.keys(contact).filter(k => !excludedProperties.includes(k))) {
            const keyName = _.upperFirst(key);
            const value = (contact as any)[key];

            if (value === undefined || value === null || !value.toString)
                continue;

            const strValue = value instanceof Date ? value.toISOString() : value.toString();
            userAttributes[keyName] = [strValue];
        }

        return {
            UserId: userId.toString(),
            UserAttributes: userAttributes
        };
    }

    private formatEndpointId(userId: number, channel: CRMChannel): string {
        return `${userId}_${channel}`.toLowerCase();
    }

    private createEndpoint(userId: number, channel: CRMChannel, user: EndpointUser, address?: string): EndpointBatchItem {
        return {
            Id: this.formatEndpointId(userId, channel),
            ChannelType: this.mapChannel(channel),
            Address: address,
            RequestId: uuid(),
            User: user
        };
    }

    private mapChannel(channel: CRMChannel): string {
        switch (channel) {
            case CRMChannel.Email:
                return 'EMAIL';
            case CRMChannel.SMS:
                return 'SMS';
        }
    }

    private formatTemplateName(skinId: string, templateName: CRMTemplateName): string {
        return `SYSTEM-${skinId}-${templateName}`;
    }

    private async getAppId(): Promise<string> {
        const key = `/${Config.stage}/pinpoint/app-id`;
        return this.parameterStore.get(key, false, true);
    }

    private mapEventData(data?: CRMEventData): EventAttributes | undefined {
        if (!data)
            return undefined;

        return _.transform(data, (result: EventAttributes, value, key) => {
            if (value !== undefined && value !== null)
                result[_.upperFirst(key)] = value.toString();
        });
    }
}