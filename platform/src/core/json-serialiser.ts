import { Singleton } from './ioc';

const DATE_FORMAT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)(Z|([+\-])(\d{2}):(\d{2}))$/;

@Singleton
export class JsonSerialiser {
    public serialise(obj: any, replacer?: (this: any, key: string, value: any) => any): string {
        return JSON.stringify(obj, replacer);
    }

    public deserialise<T>(value: string, reviver?: (this: any, key: string, value: any) => any): T {
        return JSON.parse(value, (k, v) => {
            if (reviver)
                v = reviver(k, v);

            return this.reviver(k, v);
        }) as T;
    }

    private reviver(_key: string, value: any): any {
        if (typeof value === 'string' && DATE_FORMAT.test(value))
            return new Date(value);

        return value;
    }
}