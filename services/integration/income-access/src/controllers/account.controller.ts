import { GlobalDB } from '@tcom/platform/lib/core/db';
import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { APIGatewayEvent, ProxyResult } from 'aws-lambda';
import { LogClass, LogLevel } from '@tcom/platform/lib/core/logging';
import { UserEntity } from '@tcom/platform/lib/user/entities';
import { BaseController } from './base.controller';
import { Between, IsNull, Not } from 'typeorm';
import moment from 'moment';

@Singleton
@LogClass({ level: LogLevel.Info })
export class AccountController extends BaseController {
    constructor(
        @Inject private readonly db: GlobalDB) {
            super();
        }

    public async process(event: APIGatewayEvent): Promise<ProxyResult> {
        const dateRange = this.getDateRange(event);

        const connection = await this.db.getConnection();

        const data = await connection.createQueryBuilder(UserEntity, 'user')
            .select(['id', 'displayName', 'regCountry', 'createTime', 'bTag'])
            .where({
                createTime: Between(dateRange.from, dateRange.to),
                bTag: Not(IsNull())
            })
            .getRawMany();

        const response = {
            Registrations: data.map(r => ({
                registrationDate: moment(r.createTime).toISOString(),
                playerId: r.id,
                username: r.displayName,
                bTag: r.bTag,
                country: r.regCountry
            }))
        };

        return {
            statusCode: 200,
            body: JSON.stringify(response)
        };
    }
}
