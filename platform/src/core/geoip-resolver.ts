import { Config } from './config';
import { GeoIpInfo } from './geoip-info';
import { Inject, Singleton } from './ioc';
import { JsonSerialiser } from './json-serialiser';
import { ParameterStore } from './parameter-store';
import { Redis } from './redis';
import axios, { AxiosError } from 'axios';
import _ from 'lodash';
import Logger, { LogClass } from './logging';
import { retry, RetryOptions } from './utilities';

interface IpStackIpData {
    ip: string;
    type: string;
    continent_code: string;
    continent_name: string;
    country_code: string;
    country_name: string;
    region_code: string;
    region_name: string;
    city: string;
    zip: string;
    latitude: number;
    longitude: number;
    timezone: {
        id: string;
        current_time: string;
        code: string;
        is_daylight_savings: boolean;
    };
}

interface IpStackError {
    error: {
        code: number;
        type: string;
        info: string;
    };
}

@Singleton
@LogClass()
export class GeoIpResolver {
    private readonly cacheKey = 'GEOIP';
    private readonly useHttps = true;

    private readonly maxRetries = 5;
    private readonly retryConfig: Partial<RetryOptions> = {
        shouldRetry: this.isRetryable,
        onRetry: (err, retryCount) => Logger.warn(`IP Stack API call failed, retry ${retryCount}/${this.maxRetries}: ${err.message}`),
        onSuccess: (retryCount, totalTime) => {
            if (retryCount === 0)
                return;

            Logger.error(`IP Stack API call succeeded after ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'} and ${totalTime} ms.`);
        }
    };

    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
    }

    public async resolve(ip: string): Promise<GeoIpInfo> {
        const rawIpInfo = await this.redis.cluster.hget(this.cacheKey, ip);

        if (rawIpInfo)
            return this.serialiser.deserialise(rawIpInfo);

        const info = await this.lookup(ip);
        await this.redis.cluster.hset(this.cacheKey, ip, this.serialiser.serialise(info));
        return info;
    }

    public async bulkResolve(ips: string[]): Promise<GeoIpInfo[]> {
        const cachedData: GeoIpInfo[] = [];
        const rawData = await this.redis.cluster.hmget(this.cacheKey, ...ips);

        for (const rawIpInfo of rawData)
            if (rawIpInfo !== null)
                cachedData.push(this.serialiser.deserialise(rawIpInfo));

        const uncachedIps = ips.filter(i => !cachedData.find(c => c.ip === i));

        if (uncachedIps.length === 0)
            return cachedData;

        const info = await this.bulkLookup(uncachedIps);
        const dataToCache = _.chain(info)
            .keyBy(s => s.ip)
            .mapValues(d => this.serialiser.serialise(d))
            .value();
        await this.redis.cluster.hmset(this.cacheKey, dataToCache);
        return cachedData.concat(info);
    }

    private async lookup(ip: string): Promise<GeoIpInfo> {
        const accessKey = await this.parameterStore.get(`/${Config.stage}/integration/ipstack/api-key`, true, true);

        return retry(async () => {
            const response = await axios.get(`${this.getBaseUrl()}/${ip}`, {
                params: {
                    access_key: accessKey
                },
                timeout: 1000
            });

            if (response.data.error) {
                const errorResponse = response.data as IpStackError;
                throw new Error(errorResponse.error.info);
            }

            return this.mapData(response.data as IpStackIpData);
        }, this.maxRetries, this.retryConfig);
    }

    private async bulkLookup(ips: string[]): Promise<GeoIpInfo[]> {
        const accessKey = await this.parameterStore.get(`/${Config.stage}/integration/ipstack/api-key`, true, true);

        const chunks = _.chunk(ips, 50);
        const results: GeoIpInfo[] = [];

        for (const chunk of chunks) {
            const ipList = chunk.join(',');
            const response = await axios.get(`${this.getBaseUrl()}/${ipList}`, {
                params: {
                    access_key: accessKey
                }
            });

            if (response.data.error) {
                const errorResponse = response.data as IpStackError;
                throw new Error(errorResponse.error.info);
            }

            const data = response.data as IpStackIpData[];
            const mappedData = data.map(d => this.mapData(d));
            results.push(...mappedData);
        }

        return results;
    }

    private mapData(data: IpStackIpData): GeoIpInfo {
        return {
            ip: data.ip,
            city: data.city,
            country: data.country_code,
            latitude: data.latitude,
            longitude: data.longitude,
            postalCode: data.zip,
            region: data.region_name,
            regionCode: data.region_code
        };
    }

    private getBaseUrl(): string {
        return `${this.useHttps ? 'https' : 'http'}://api.ipstack.com`;
    }

    private isRetryable(err: Error): boolean {
        const reqError = err as AxiosError;

        if (reqError.response?.status && [502, 503].includes(reqError.response.status))
            return true;

        if (reqError.code && ['ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'].includes(reqError.code))
            return true;

        return false;
    }
}