import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler, GeoIpResolver, GeoIpInfo } from '@tcom/platform/lib/core';
import _ from 'lodash';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { GlobalDB } from '@tcom/platform/lib/core/db';
import { UserIpEntity } from '@tcom/platform/lib/user/entities';
import { FindManyOptions, IsNull } from 'typeorm';

interface UpdateEvent {
    all?: true;
}

@Singleton
@LogClass()
export class UpdateGeoIpDataHandler {
    constructor(@Inject private readonly db: GlobalDB,
                @Inject private readonly geoIpResolver: GeoIpResolver) {
    }

    public async execute(event: UpdateEvent): Promise<void> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<UserIpEntity> = {};

        if (!event.all)
            options.where = {
                country: IsNull()
            };

        const ipEntities = await connection.manager.find(UserIpEntity, options);

        if (ipEntities.length === 0) {
            Logger.info('Nothing to update.');
            return;
        }

        console.log(`Found ${ipEntities.length} to resolve.`);

        const ipAddresses = _.uniq(ipEntities.map(d => d.ipAddress));
        const ipData: GeoIpInfo[] = [];

        console.log(`Resolving ${ipAddresses.length} distinct IP addresses...`);

        for (const ip of ipAddresses) {
            const data = await this.geoIpResolver.resolve(ip);
            ipData.push(data);
        }

        console.log(`${ipData.length} IP addresses resolved.`);

        if (ipData.length === 0) {
            Logger.warn('No IP data was resolved.');
            return;
        }

        for (const entity of ipEntities) {
            const geoip =  ipData.find(d => d.ip === entity.ipAddress);
            if (!geoip) {
                Logger.warn(`Could not find IP data for ${entity.ipAddress}!`);
                continue;
            }

            entity.country = geoip.country;
            entity.city = geoip.city;
            entity.region = geoip.region;
            entity.regionCode = geoip.regionCode;
            entity.postalCode = geoip.postalCode;
            entity.latitude = geoip.latitude;
            entity.longitude = geoip.longitude;
        }

        console.log('Saving entities...');

        const chunks = _.chunk(ipEntities, 100);
        let batchCount = 0;

        for (const chunk of chunks) {
            batchCount++;
            console.log(`Saving batch ${batchCount}...`);
            await connection.manager.save(chunk);
            console.log(`Batch ${batchCount} saved.`);
        }

        console.log('Entities saved.');
    }
}

export const updateGeoIpData = lambdaHandler((event: UpdateEvent) => IocContainer.get(UpdateGeoIpDataHandler).execute(event));