const maskedProperties = [
    'authorization',
    'password',
    'x-tcom-sig',
    'secret',
    'apiKey'
];

function sanitiser(key: string, value: any): any {
    if (maskedProperties.includes(key))
        return '************';

    return value;
}

export class LoggerJsonSerialiser {
    public static serialise(obj: any): string {
        return JSON.stringify(obj, sanitiser);
    }
}