import * as Mocha from 'mocha';

type ClassType = new(...args: any[]) => {};
type MethodDecorator = (target: any, methodName: string, descriptor: PropertyDescriptor) => void;

function hasTestMetadata(type: 'suite' | 'tests' | 'hook', klass: ClassType, propertyName: string): boolean {
    return Reflect.hasMetadata(`mocha:${type}`, klass.prototype, propertyName);
}

function getTestMetadata(type: 'suite' | 'tests' | 'hook', klass: ClassType, propertyName: string): any {
    return Reflect.getMetadata(`mocha:${type}`, klass.prototype, propertyName);
}

function generateTests(instance: any, methodName: string): void {
    if (!hasTestMetadata('tests', instance.constructor, methodName))
        return;

    const tests = getTestMetadata('tests', instance.constructor, methodName);
    for (const test of tests)
        Mocha.test(test.title, () => instance[methodName].apply(instance, test.parameters));
}

function generateMethod(instance: any, methodName: string): void {
    if (!hasTestMetadata('suite', instance.constructor, methodName)) {
        generateTests(instance, methodName);
        return;
    }

    const suite = getTestMetadata('suite', instance.constructor, methodName);

    Mocha.suite(suite.title || `${methodName}()`, () => {
        generateTests(instance, methodName);
    });
}

function generateHook(instance: any, methodName: string): void {
    if (!hasTestMetadata('hook', instance.constructor, methodName))
        return;

    const hookType = getTestMetadata('hook', instance.constructor, methodName);

    switch(hookType) {
        case 'suiteSetup':
            Mocha.suiteSetup(() => instance[methodName].apply(instance));
            break;

        case 'suiteTeardown':
            Mocha.suiteTeardown(() => instance[methodName].apply(instance));
            break;

        case 'setup':
            Mocha.setup(() => instance[methodName].apply(instance));
            break;

        case 'teardown':
            Mocha.teardown(() => instance[methodName].apply(instance));
            break;
    }
}

function generate(klass: ClassType, title?: string): void {
    const instance = new klass();
    const propMap = Object.getOwnPropertyDescriptors(klass.prototype);

    Mocha.describe(title || klass.name, () => {
        for (const name of Object.keys(propMap)) {
            const prop = propMap[name];

            if (prop.get || prop.set)
                continue;

            generateHook(instance, name);
            generateMethod(instance, name);
        }
    });
}

function Suite(title: string): (target: any, methodName?: string) => void {
    return (target: any, methodName?: string) => {
        if (target && methodName)
            Reflect.defineMetadata('mocha:suite', {
                title
            }, target, methodName);
        else
            generate(target, title);
    };
}

function Test(title: string, parameters?: any[]): MethodDecorator {
    return (target: any, methodName: string) => {
        const tests: any[] = getTestMetadata('tests', target.constructor, methodName) || [];
        Reflect.deleteMetadata('mocha:tests', target.constructor.prototype, methodName);

        tests.unshift({
            title,
            parameters
        });

        Reflect.defineMetadata('mocha:tests', tests, target, methodName);
    };
}

function Setup(): MethodDecorator {
    return (target: any, methodName: string) => {
        Reflect.defineMetadata('mocha:hook', 'setup', target, methodName);
    };
}

function Teardown(): MethodDecorator {
    return (target: any, methodName: string) => {
        Reflect.defineMetadata('mocha:hook', 'teardown', target, methodName);
    };
}

function SuiteSetup(): MethodDecorator {
    return (target: any, methodName: string) => {
        Reflect.defineMetadata('mocha:hook', 'suiteSetup', target, methodName);
    };
}

function SuiteTeardown(): MethodDecorator {
    return (target: any, methodName: string) => {
        Reflect.defineMetadata('mocha:hook', 'suiteTeardown', target, methodName);
    };
}

const Describe = Suite;
const It = Test;
const Specify = Test;
const Before = SuiteSetup;
const BeforeEach = Setup;
const AfterEach = Teardown;
const After = SuiteTeardown;
const context = Mocha.describe;

const helpers = {
    ...Mocha,
    context,
    Suite,
    Test,
    Setup,
    Teardown,
    SuiteSetup,
    SuiteTeardown,
    Describe,
    It,
    Specify,
    Before,
    BeforeEach,
    AfterEach,
    After
};

export = helpers;