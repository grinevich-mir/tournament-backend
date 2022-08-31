export function LogDisable(): (target: any, methodName: string, descriptor: PropertyDescriptor) => void {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
        if (descriptor === undefined)
            descriptor = Object.getOwnPropertyDescriptor(target, propertyName) as PropertyDescriptor;

        if (descriptor.get || descriptor.set)
            return descriptor;

        const originalMethod = descriptor.value;
        originalMethod.__methodLoggerPatchApplied = true;
        return descriptor;
    };
}