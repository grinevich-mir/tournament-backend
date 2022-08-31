import * as env from 'env-var';
import { Region } from './regions';

class Configuration {
    public get domain(): string {
        return env.get('DOMAIN').required().asString();
    }

    public get stage(): string {
        return env.get('STAGE').required().asString();
    }

    public get region(): Region {
        return env.get('REGION').required().asString() as Region;
    }

    public get accountId(): number {
        return env.get('AWS_ACC').required().asInt();
    }
}

export const Config = new Configuration();