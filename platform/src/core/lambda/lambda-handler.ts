import 'source-map-support/register';
import { Handler, Context } from 'aws-lambda';
import { ConnectionManager } from '../db/connection-manager';
import Logger, { UserLog, LogContextResolver, LogOriginator } from '../logging';
import { Container, Scope } from '../ioc';
import * as env from 'env-var';
import { bootstrap } from '../bootstrap';

Container.bind(LogContextResolver).provider({
    get: () => new LogContextResolver(() => ({
        originator: LogOriginator.System,
        application: `${env.get('SERVICE').required().asString()}-${env.get('FUNCTION', 'unknown').asString()}`
    }))
}).scope(Scope.Singleton);

export interface LambdaHandlerOptions {
    errorHandler?: (err: Error) => void;
}

export function lambdaHandler<T extends Handler = Handler>(handler: T, options?: LambdaHandlerOptions): Handler {
    bootstrap();

    const timeoutHandler = (context: Context) => {
        Logger.error(`Function ${context.functionName} (Request ID: ${context.awsRequestId}) timed out.`);
    };

    let timeoutTimer: NodeJS.Timeout;

    return async (event, context, callback) => {
        if (event.source === 'WARMUP') {
            console.log('WARMUP');
            return 'Warmed Up';
        }

        Logger.clearBuffer();
        Error.stackTraceLimit = 30;

        timeoutTimer = setTimeout(() => timeoutHandler(context), context.getRemainingTimeInMillis() - 500);

        try {
            return await handler(event, context, callback);
        } catch (err) {
            if (options?.errorHandler)
                options.errorHandler(err);
            else {
                Logger.error(`Invoke Error`, err);
                throw err;
            }
        } finally {
            clearTimeout(timeoutTimer);
            await Promise.all([
                ConnectionManager.closeAll(),
                UserLog.send(),
                Logger.wait()
            ]);
        }
    };
}