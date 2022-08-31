import 'source-map-support/register';
import { APIGatewayProxyHandler, Handler, Context, APIGatewayProxyEvent } from 'aws-lambda';
import bodyParser from 'body-parser';
import cors, { CorsOptions } from 'cors';
import express, { ErrorRequestHandler, Request } from 'express';
import methodOverride from 'method-override';
import serverless from 'serverless-http';
import { HttpStatusCode } from '../core/http-status-code';
import { GeneralError, bootstrap } from '../core';
import { Authenticators, registerAuthenticators } from './auth';
import { ConnectionManager } from '../core/db/connection-manager';
import { LogContextResolver, UserLog } from '../core/logging';
import { Container, IocContainer, Scope } from '../core/ioc';
import { UserApiRequest } from './user-api-request';
import env from 'env-var';
import Logger from '../core/logging';
import cls from 'cls-hooked';
import { ApiUser } from './api-user';
import { ApiRequest } from './api-request';
import { GeoIpResolver } from '../core/geoip-resolver';

const corsOptions: CorsOptions = {
    allowedHeaders: ['Content-Type' , 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
    methods: ['DELETE',  'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
    origin: '*'
};

export const ErrorHandlerOptions = {
    reportAll: false
};

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (!err) {
        next();
        return;
    }

    const statusCode = err.status || HttpStatusCode.InternalServerError;

    if (ErrorHandlerOptions.reportAll || statusCode >= 500)
        Logger.error(err);
    else
        Logger.warn(err.message, err);

    if (err.constructor === Error)
        err = new GeneralError(err.message);

    err.stack = undefined;

    res.statusMessage = err.message;
    res.status(statusCode).send(err);
};

function resolveRequestUserId(request: Request): string {
    const apiReq = request as unknown as UserApiRequest<ApiUser>;

    if (!apiReq.user)
        return 'Anonymous';

    return apiReq.user.id.toString();
}

const clsNamespace = cls.createNamespace('app');

Container.bind(LogContextResolver).provider({
    get: () => new LogContextResolver(() => ({
        originatorId: resolveRequestUserId(clsNamespace.get('request')),
        request: clsNamespace.get('request')
    }))
}).scope(Scope.Singleton);

export default function initializeApi(registerRoutes: (app: express.Express) => void, authenticators?: Authenticators | false): APIGatewayProxyHandler | Handler {
    LogContextResolver.default.application = env.get('SERVICE').required().asString();

    bootstrap();

    const x = express();

    x.set('json replacer', (key: string, value: any): any => {
        if (value === null)
            return undefined;

        return value;
    });

    x.use(bodyParser.urlencoded({ extended: true }));
    x.use(bodyParser.json());
    x.use(methodOverride());
    x.use(cors(corsOptions));
    x.disable('x-powered-by');
    x.use((req, res, next) => {
        clsNamespace.run(() => {
            clsNamespace.set('request', req);
            next();
        });
    });
    x.use(async (req, res, next) => {
        const resolver = IocContainer.get(GeoIpResolver);
        try {
            (req as ApiRequest).geoIp = await resolver.resolve(req.ip);
        } catch (err) {
            Logger.error('Geo IP lookup', err);
        } finally {
            next();
        }
    });

    if (authenticators !== false)
        registerAuthenticators(authenticators);

    registerRoutes(x);
    x.use(errorHandler);
    const handler = serverless(x, {
        binary: ['image/png', 'image/jpeg']
    });

    const timeoutHandler = (context: Context) => {
        Logger.error(`Function ${context.functionName} (Request ID: ${context.awsRequestId}) timed out.`);
    };

    let timeoutTimer: NodeJS.Timeout;

    return async (event: APIGatewayProxyEvent & { source: string }, context: Context) => {
        if (event.source === 'WARMUP') {
            console.log('WARMUP');
            return 'Warmed Up';
        }

        Logger.clearBuffer();
        Error.stackTraceLimit = 30;

        timeoutTimer = setTimeout(() => timeoutHandler(context), context.getRemainingTimeInMillis() - 500);

        Logger.info(`${event.httpMethod} ${event.path}`);
        try {
            return await handler(event, context);
        } catch (err) {
            Logger.error(`Invoke Error`, err);
            throw err;
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