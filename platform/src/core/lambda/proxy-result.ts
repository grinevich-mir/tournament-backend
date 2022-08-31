import { ProxyResult } from 'aws-lambda';

export function ok(): ProxyResult {
    return {
        body: 'Ok',
        statusCode: 200
    };
}