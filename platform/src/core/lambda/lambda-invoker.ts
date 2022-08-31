import { Lambda } from 'aws-sdk';
import { Config } from '../config';
import * as env from 'env-var';
import { Region } from '../regions';
import { JsonSerialiser } from '../json-serialiser';
import { Singleton, Inject } from '../ioc';

export enum LambdaInvocationType {
    RequestResponse = 'RequestResponse',
    Event = 'Event',
    DryRun = 'DryRun'
}

export interface LambdaInvocationConfig {
    region?: Region;
    payload?: any;
    type?: LambdaInvocationType;
}

@Singleton
export class LambdaInvoker {
    constructor(
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async invoke<TResponse = void>(domain: string, name: string, config: LambdaInvocationConfig): Promise<TResponse> {
        const l = new Lambda({
            region: config.region || Config.region
        });

        const functionName = `system-${domain}-${Config.stage}-${name}`;
        const request = this.buildRequest(functionName, config);
        const data = await l.invoke(request).promise();

        if (data.FunctionError)
            if (typeof data.Payload === 'string') {
                const errorResponse = this.serialiser.deserialise<any>(data.Payload);
                const error = new Error(errorResponse.errorMessage);
                error.name = errorResponse.errorType;
                error.stack = errorResponse.trace.join('\n');
                throw error;
            } else
                throw new Error('Lambda call failed.');

        if (request.InvocationType === 'Event')
            return {} as TResponse;

        if (typeof data.Payload === 'string' && data.Payload.length > 0)
            return this.serialiser.deserialise<TResponse>(data.Payload);

        return data.Payload as TResponse;
    }

    private buildRequest(name: string, config: LambdaInvocationConfig): Lambda.InvocationRequest {
        let context = env.get('SERVICE').required().asString();
        const func = env.get('FUNCTION').asString();

        if (func)
            context += `-${func}`;

        context = Buffer.from(JSON.stringify({ source: context })).toString('base64');

        return {
            InvocationType: config.type || LambdaInvocationType.RequestResponse,
            FunctionName: name,
            ClientContext: context,
            Payload: config.payload ? this.serialiser.serialise(config.payload) : undefined
        };
    }
}