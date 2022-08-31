import Logger from '@tcom/platform/lib/core/logging';

export function LogRequest(action: string) {
    return (target: any, methodName: string, descriptor?: PropertyDescriptor) => {
        if (descriptor === undefined)
            descriptor = Object.getOwnPropertyDescriptor(target, methodName);

        if (!descriptor)
            return descriptor;

        const originalMethod = descriptor.value;

        descriptor.value = async function(...args: any[]) {
            const request = args[0];

            let methodResult = originalMethod.apply(this, args);

            if (methodResult instanceof Promise)
                methodResult = await methodResult;

            Logger.info('Result', {
                action,
                request,
                response: methodResult
            });

            return methodResult;
        };

        return descriptor;
    };
}