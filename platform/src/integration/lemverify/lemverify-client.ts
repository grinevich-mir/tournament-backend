import AWS from 'aws-sdk';
import request from 'request-promise';
import moment from 'moment';
import { LEMVerifyDownloadResponse, LEMVerifyCombinationRequest, LEMVerifyResponse as LEMVerifyStartResponse } from './interfaces';
import { Config, NotFoundError, ParameterStore } from '../../core';
import { Inject, Singleton } from '../../core/ioc';
import { UserManager } from '../../user';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class LEMVerifyClient {
    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly userManager: UserManager) {
    }

    public async requestVerification(userId: number): Promise<LEMVerifyStartResponse> {
        const lemverifyRequest: LEMVerifyCombinationRequest = {
            amlRequired: false,
            clientRef: userId.toString(),
            redactMe: false,
            requestSmartsearchReport: true
        };

        const accountId = await this.getAccountId();
        const apiKey = await this.getApiKey();

        const options = {
            method: 'POST',
            url: `https://api.lemverify.io/api/v1/${accountId}/combination`,
            headers: {
                'Content-Type': 'application/json',
                'x-lem-key': apiKey
            },
            body: lemverifyRequest,
            json: true
        };

        const response = await request(options) as LEMVerifyStartResponse;

        if (!response)
            throw new Error(`invalid response from lemverify`);

        return response;
    }

    public async getDocumentUrl(id: string): Promise<string> {
        const accountId = await this.getAccountId();
        const apiKey = await this.getApiKey();

        const options = {
            url: `https://api.lemverify.io/integrations/v1/webhooks/${accountId}/document/${id}/url`,
            headers: {
                'Content-Type': 'application/json',
                'x-lem-key': apiKey
            },
            json: true
        };

        const response = await request(options) as LEMVerifyDownloadResponse;

        if (!response || !response.report)
            throw new Error(`invalid response from lemverify: ${response}`);

        return response.report;
    }

    public async saveDocument(id: string, userId: number): Promise<void> {

        const documentUrl = await this.getDocumentUrl(id);
        const document = await request({
            uri: documentUrl,
            encoding: null
        });
        const user = await this.userManager.get(userId);

        if (!user)
            throw new NotFoundError('user not found.');

        const skin = user.skinId && user.skinId ? user.skinId : 'tournament';
        const bucket = `io.tgaming.${Config.stage}.${skin}.players`;
        const path = `verification/${userId}/lemverify_report_${id}_${moment.utc().valueOf()}.pdf`;
        await this.putS3Object(document, bucket, path);
    }

    public async getAccountId(): Promise<string> {
        return this.getParameter('account-id');
    }

    public async getApiKey(): Promise<string> {
        return this.getParameter('api-key');
    }

    private async getParameter(name: string, decrypt: boolean = true): Promise<string> {
        return this.parameterStore.get(`/${Config.stage}/integration/lemverify/${name}`, decrypt, true);
    }

    private async putS3Object(object: string, bucket: string, path: string): Promise<void> {
        const params = {
            Bucket: bucket,
            Key: path,
            Body: object
        };
        const s3 = new AWS.S3();
        await s3.putObject(params).promise();
    }

}
