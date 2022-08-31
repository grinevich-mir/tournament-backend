import { JsonSerialiser } from '../../../core';
import { Singleton } from '../../../core/ioc';
import { SkrillError } from '../skrill-error';
import qs from 'querystring';

const REPLACEMENT_TOKENS = [
    '\n',
    '\t'
];

export class SkrillReportResponseDeserialiser {
    private readonly deserialiser = new SkrillReportDeserialiser();

    public run<T>(value: string): T {
        const [statusText, data] = value.split('\n');

        if (!this.validate(statusText))
            throw new Error('Failed to deserialise Skrill status report response.');

        const cleansed = this.replace(data);

        return this.deserialiser.deserialise<T>(cleansed);
    }

    private validate(value: string): boolean {
        const status = value.split('\t');
        const statusCode = Number(status[0]);
        const statusText = this.replace(status[status.length - 1]);

        switch (statusCode) {
            case 200:
                return true;

            default:
                throw new SkrillError(statusCode, statusText);
        }
    }

    private replace(value: string): string {
        REPLACEMENT_TOKENS.forEach((replacement: string) => value.replace(replacement, ''));
        return value;
    }
}

@Singleton
export class SkrillReportDeserialiser {
    private readonly serialiser = new JsonSerialiser();

    public deserialise<T>(data: any): T {
        const parsed = qs.parse(data);
        const serialised = this.serialiser.serialise(parsed);
        return this.serialiser.deserialise<T>(serialised, this.reviver);
    }

    private reviver(key: string, value: any): any {
        if (typeof value === 'string' && !isNaN(Number(value)))
            return Number(value);

        return value;
    }
}