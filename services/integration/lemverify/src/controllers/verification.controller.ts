import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { APIGatewayEvent, ProxyResult } from 'aws-lambda';
import { Config, NotFoundError, JsonSerialiser } from '@tcom/platform/lib/core';
import crypto from 'crypto';
import { VerificationRequestRepository } from '@tcom/platform/lib/verification/repositories';
import { VerificationRequestState, VerificationManager } from '@tcom/platform/lib/verification';
import { LEMVerifyWebhookRequest, LEMVerifyClient } from '@tcom/platform/lib/integration/lemverify';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass({ arguments: false, result: false })
export class VerificationController {
    constructor(
        @Inject private readonly verificationRequestRepository: VerificationRequestRepository,
        @Inject private readonly verificationManager: VerificationManager,
        @Inject private readonly lemverifyClient: LEMVerifyClient,
        @Inject private readonly serialiser: JsonSerialiser) {
    }

    public async process(event: APIGatewayEvent): Promise<ProxyResult> {
        if (!event.body)
            throw new Error('Event body cannot be empty.');

        const requestBody = this.serialiser.deserialise<LEMVerifyWebhookRequest>(event.body);
        const requestSignature = event.headers['x-lemverify-signature'];

        if (!await this.isValidSignature(requestBody, requestSignature))
            throw new Error('Invalid signature');

        const request = await this.verificationRequestRepository.get(requestBody.id);

        if (!request)
            throw new NotFoundError('Verification request not found.');

        await this.lemverifyClient.saveDocument(request.id, request.userId);
        await this.updateState(requestBody.id, requestBody.result);

        return {
            statusCode: 200,
            body: 'Ok'
        };
    }

    private async updateState(id: string, result: string): Promise<void> {
        let verificationState: VerificationRequestState;

        switch (result) {
            case 'PASSED':
                verificationState = VerificationRequestState.Complete;
                break;
            case 'REFER':
                verificationState = VerificationRequestState.Processing;
                break;
            default:
                verificationState = VerificationRequestState.Error;
                break;
        }

        await this.verificationManager.setRequestState(id, verificationState);
    }

    private async isValidSignature(request: LEMVerifyWebhookRequest, signature: string): Promise<boolean> {
        const webhookUrl = `https://integrations.${Config.domain}/lemverify/verification`;
        const apiKey = await this.lemverifyClient.getApiKey();
        const token = `${webhookUrl}${request.id}${request.friendlyId}${request.type}${request.result}`;

        const binaryHmac = crypto.createHmac('sha1', apiKey).update(token);
        const base64Hmac = binaryHmac.digest('base64');

        return base64Hmac === signature;
    }
}
