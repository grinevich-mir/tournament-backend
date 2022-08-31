import { LogLevel } from '../log-level';
import uuid from 'uuid/v4';
import Logger from '../logger';
import util from 'util';
interface PatchedMethod {
    (...args: any[]): any;
    __methodLoggerPatchApplied: boolean;
}

interface ArgumentMap {
    [key: string]: any;
}

function getPrefix(classInstance: any, methodName: string): string {
    if (!classInstance || !classInstance.constructor)
        return methodName;

    const className = classInstance.constructor.name;
    return className ? `${className}.${methodName}` : methodName;
}

function getArgumentNames<T extends (...args: any[]) => any>(method: T): string[] {
    const methodString = method.toString();
    const matches = methodString.match(/\(.*?\)/);

    if (!matches || matches.length === 0)
        return [];

    return matches[0].replace(/[()]/gi, '').replace(/\s/gi, '').split(',').map(a => a.split('=')[0]);
}

function mapArguments(argNames: string[], values: any[]): ArgumentMap | undefined {
    const map: ArgumentMap = {};

    for (let i = 0; i < argNames.length; i++) {
        let name = argNames[i];
        let value = values[i];

        if (!name)
            continue;

        if (name.startsWith('...')) {
            name = name.slice(3);
            value = values.slice(i);
        }

        map[name] = value;
    }

    if (Object.keys(map).length === 0)
        return undefined;

    return map;
}

function formatMethod(instance: any, methodName: string, argNames: string[]): string {
    const prefix = getPrefix(instance, methodName);
    const argsStr = argNames.join(', ');
    return `${prefix}(${argsStr})`;
}

function patchAsyncMethod<T extends (...args: any[]) => any>(method: T, methodName: string, options: LogMethodOptions): PatchedMethod {
    const argNames = getArgumentNames(method);

    return async function (this: any, ...args: any[]) {
        const startTime = Date.now();
        const level = options.level || LogLevel.Debug;

        const methodStr = formatMethod(this, methodName, argNames);
        const callId = uuid();
        const argMap = mapArguments(argNames, args);
        Logger.log(level, `async ${methodStr} - Start: ${callId}`, options.arguments && argMap ? { arguments: argMap } : undefined);

        try {
            const promise = method.apply(this, args);
            const result = await promise;
            const endTime = Date.now();
            const duration = endTime - startTime;
            const hasResult = !(result === undefined || result === null);

            Logger.log(level, `async ${methodStr} - End: ${callId} (Duration: ${duration} ms)`, options.result && hasResult ? { result } : undefined);
            return result;
        } catch (err) {
            const endTime = Date.now();
            const duration = endTime - startTime;

            Logger.log(level, `async ${methodStr} - Error: ${callId} (Duration: ${duration} ms)`, { error: err });
            throw err;
        }
    } as PatchedMethod;
}

function patchSyncMethod<T extends (...args: any[]) => any>(method: T, methodName: string, options: LogMethodOptions): PatchedMethod {
    const argNames = getArgumentNames(method);

    return function (this: any, ...args: any[]) {
        const startTime = Date.now();
        const methodStr = formatMethod(this, methodName, argNames);
        const level = options.level || LogLevel.Debug;

        try {
            const argMap = mapArguments(argNames, args);
            Logger.log(level, `${methodStr} - Start`, options.arguments && argMap ? { arguments: argMap } : undefined);

            const result = method.apply(this, args);
            const endTime = Date.now();
            const duration = endTime - startTime;
            const hasResult = !(result === undefined || result === null);

            Logger.log(level, `${methodStr} - End (Duration: ${duration} ms)`, options.result && hasResult ? { result } : undefined);
            return result;
        } catch (err) {
            const endTime = Date.now();
            const duration = endTime - startTime;

            Logger.log(level, `${methodStr} - Error (Duration: ${duration} ms)`, { error: err });
            throw err;
        }
    } as PatchedMethod;
}

export function patchMethod<T extends (...args: any[]) => any>(method: T, methodName: string, options?: LogMethodOptions): PatchedMethod {
    options = Object.assign({
        arguments: true,
        result: true
    }, options);

    const patchedMethod = util.types.isAsyncFunction(method) ?
        patchAsyncMethod(method, methodName, options) :
        patchSyncMethod(method, methodName, options);

    patchedMethod.__methodLoggerPatchApplied = true;
    return patchedMethod;
}

export interface LogMethodOptions {
    level?: LogLevel;
    arguments?: boolean;
    result?: boolean;
}

export function LogMethod(options?: LogMethodOptions): (target: any, methodName: string, descriptor: PropertyDescriptor) => void {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
        if (descriptor === undefined)
            descriptor = Object.getOwnPropertyDescriptor(target, propertyName) as PropertyDescriptor;

        if (descriptor.get || descriptor.set)
            return descriptor;

        const originalMethod = descriptor.value;

        if (originalMethod.__methodLoggerPatchApplied === true)
            return descriptor;

        descriptor.value = patchMethod(originalMethod, propertyName, options);

        return descriptor;
    };
}