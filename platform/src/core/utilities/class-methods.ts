export interface ClassMethodOptions {
    deep?: boolean;
}

const excludedMethods = ['constructor'];

function getMethods<T extends new(...args: any[]) => {}>(input: T, options: ClassMethodOptions): string[] {
    if (!input)
        return [];

    let methods = input.prototype ? Object.getOwnPropertyNames(input.prototype) : [];

    if (options.deep)
        methods = methods.concat(getMethods(Object.getPrototypeOf(input), options));

    methods = methods.filter(m => !excludedMethods.includes(m));

    return methods;
}

export function classMethods<T extends new(...args: any[]) => {}>(input: T, options?: ClassMethodOptions): string[] {
    options = Object.assign({
        deep: false
    }, options);

    return getMethods(input, options);
}