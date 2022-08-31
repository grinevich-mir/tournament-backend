import { patchMethod, LogMethodOptions } from './log-method.decorator';
import { classMethods } from '../../utilities';

export function LogClass<T extends new(...args: any[]) => {}>(options?: LogMethodOptions): (target: T) => void {
    return (target: T) => {
        const methodNames = classMethods(target);

        for (const methodName of methodNames) {
            const descriptor = Object.getOwnPropertyDescriptor(target.prototype, methodName);

            if (!descriptor || descriptor.get || descriptor.set)
                continue;

            const originalMethod = target.prototype[methodName];

            if (typeof originalMethod !== 'function' || originalMethod.__methodLoggerPatchApplied === true)
                continue;

            target.prototype[methodName] = patchMethod(originalMethod, methodName, options);
        }
    };
}