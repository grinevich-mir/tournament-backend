import { Singleton } from './ioc';
import AWS from 'aws-sdk';
import moment from 'moment';
import { LogClass, LogDisable } from './logging';

interface CacheItem {
    parameter: AWS.SSM.Parameter;
    expires?: Date;
}

const CACHE: { [key: string]: CacheItem } = {};

@Singleton
@LogClass({ result: false })
export class ParameterStore {
    public async get(key: string, decrypt: boolean = false, cache: boolean | number | Date = false): Promise<string> {
        const parameter = await this.fetch(key, decrypt, cache);

        if (parameter.Type === 'StringList')
            throw new Error(`Requested parameter ${key} as a string but it is a string list.`);

        return parameter.Value as string;
    }

    public async getList(key: string, cache: boolean | number | Date = false): Promise<string[]> {
        const parameter = await this.fetch(key, false, cache);

        if (parameter.Type !== 'StringList')
            throw new Error(`Requested parameter ${key} as a string list but it is a string.`);

        return (parameter.Value as string).split(',');
    }

    @LogDisable()
    private async fetch(key: string, decrypt: boolean = false, cache: boolean | number | Date = false): Promise<AWS.SSM.Parameter> {
        const cachedItem = CACHE[key];

        if (cache && cachedItem) {
            if (!cachedItem.expires)
                return cachedItem.parameter;

            if (cachedItem.expires > new Date())
                return cachedItem.parameter;
            else
                delete CACHE[key];
        }

        try {
            const ssm = new AWS.SSM();
            const result = await ssm.getParameter({
                Name: key,
                WithDecryption: decrypt
            }).promise();

            const parameter = result.Parameter;

            if (!parameter || !parameter.Value)
                throw new Error(`Could not get parameter value for key '${key}.'`);

            if (parameter.Type === 'SecureString' && !decrypt)
                throw new Error(`Parameter is encrypted but decrypt flag was false.`);

            if (cache)
                if (typeof cache === 'boolean')
                    CACHE[key] = { parameter };
                else if (typeof cache === 'number') {
                    const expires = moment.utc().add(cache, 'minutes').toDate();
                    CACHE[key] = {
                        parameter,
                        expires,
                    };
                } else if (cache instanceof Date)
                    CACHE[key] = { parameter, expires: cache };

            return parameter;
        } catch (err) {
            console.error(`Could not get parameter: ${key}`, err);
            throw err;
        }
    }
}