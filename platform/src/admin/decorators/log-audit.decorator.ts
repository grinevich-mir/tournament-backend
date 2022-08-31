import { AdminLog } from '../admin-log';
import { AdminLogMessage } from '../admin-log-message';
import { Controller } from '../../api';
import Logger from '../../core/logging';

export function LogAudit(resource: string, action: string, handler?: (args: any[], result: any) => any) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {

        if (descriptor === undefined)
            descriptor = Object.getOwnPropertyDescriptor(target, propertyName) as PropertyDescriptor;

        if (!descriptor)
            return descriptor;

        const originalMethod = descriptor.value;

        try {
            descriptor.value = async function (this: Controller, ...args: any[]) {
                const result = await originalMethod.apply(this, args);

                originalMethod.context = this;
                const { _request } = originalMethod.context;

                const additionalData = handler && await handler(args, result);

                const captureAudit: AdminLogMessage = {
                    timestamp: new Date(),
                    userId: _request.user.id,
                    resource,
                    action,
                    data: {
                        url: this.request.url,
                        method: this.request.method,
                        args,
                    },
                    additionalData,
                };

                await AdminLog.send(captureAudit);
                return result;
            };
        } catch (error) {
            Logger.error('Log Audit Error', error);
        }
        return descriptor;
    };
}