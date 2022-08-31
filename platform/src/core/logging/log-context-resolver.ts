import { LogContext } from './log-context';
import { IocContainer } from '../ioc';
import { Request } from 'express';
import { LogOriginator } from './log-originator';
import { DEFAULT_REGION } from '../regions';

interface SimpleRequest {
    url: string;
    method: string;
    headers: any;
    ip: string;
    route: any;
}

export class LogContextResolver {
    public static default: LogContext = {
        application: 'Unknown',
        originator: LogOriginator.System,
        region: DEFAULT_REGION
    };

    public static resolve(): LogContext {
        try {
            const resolver = IocContainer.get(LogContextResolver);

            if (!resolver)
                return this.default;

            return resolver.resolve();
        } catch (err) {
            return this.default;
        }
    }

    constructor(private readonly resolver: () => Partial<LogContext>) {
    }

    public resolve(): LogContext {
        const context = this.resolver();
        const result = Object.assign({}, LogContextResolver.default, context);

        if (result.request)
            result.request = this.mapRequest(result.request);

        return result;
    }

    private mapRequest(request: Request): SimpleRequest {
        return {
            url: request.url,
            method: request.method,
            headers: request.headers,
            ip: request.ip,
            route: request.route
        };
    }
}