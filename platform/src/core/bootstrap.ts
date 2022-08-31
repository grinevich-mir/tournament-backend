import Logger, { LogContextResolver, LogLevel } from './logging';
import { Config } from './config';
import { RollbarTransport } from './logging/transports';
import * as env from 'env-var';
import AWS from 'aws-sdk';

let bootstrapped = false;

export function bootstrap(): void {
    if (bootstrapped)
        return;

    console.log('Bootstrapping...');

    console.log('Setting AWS client timeouts...');
    AWS.config.update({
        httpOptions: {
            connectTimeout: 2000,
            timeout: 5000
        }
    });

    console.log('Setting log context defaults...');
    LogContextResolver.default.region = Config.region;

    console.log('Adding Rollbar logging transport...');
    Logger.addTransport(
        new RollbarTransport({
            level: LogLevel.Warn,
            rollbarConfig: {
                accessToken: env.get('ROLLBAR_ACCESS_TOKEN').required().asString(),
                reportLevel: 'error',
                environment: Config.stage,
                ignoreDuplicateErrors: true,
            }
        }));

    console.log('Bootstrap complete.');
    bootstrapped = true;
}