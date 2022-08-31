import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { APIGatewayEvent, ProxyResult } from 'aws-lambda';
import { VerificationManager, VerificationRequestState } from '@tcom/platform/lib/verification';
import { LEMVerifyStatusWebhookRequest } from '@tcom/platform/lib/integration/lemverify';
import { JsonSerialiser } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass({ result: false })
export class StatusController {
    constructor(
        @Inject private readonly verificationManager: VerificationManager,
        @Inject private readonly serialiser: JsonSerialiser) {
    }

    public async process(event: APIGatewayEvent): Promise<ProxyResult> {
        if (!event.body)
            throw new Error('Event body cannot be empty.');

        const requestBody = this.serialiser.deserialise<LEMVerifyStatusWebhookRequest>(event.body);
        await this.updateState(requestBody.id, requestBody.state);

        return {
            statusCode: 200,
            body: 'Ok'
        };
    }

    private async updateState(id: string, state: number): Promise<void> {
        if (state !== 2)
            return;

        await this.verificationManager.setRequestState(id, VerificationRequestState.Processing);
    }
}
