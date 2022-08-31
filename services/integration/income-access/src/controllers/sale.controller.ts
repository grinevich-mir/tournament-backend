import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { APIGatewayEvent, ProxyResult } from 'aws-lambda';
import { LogClass, LogLevel } from '@tcom/platform/lib/core/logging';
import { BaseController } from './base.controller';
import { GlobalDB } from '@tcom/platform/lib/core/db';
import { PaymentEntity } from '@tcom/platform/lib/payment/entities';
import { Between, Not } from 'typeorm';
import { PaymentStatus, PaymentType } from '@tcom/platform/lib/payment';
import moment from 'moment';
import { NumericTransformer } from '@tcom/platform/lib/core/db/orm';

@Singleton
@LogClass({ level: LogLevel.Info })
export class SaleController extends BaseController {
    constructor(
        @Inject private readonly db: GlobalDB) {
            super();
        }

    public async process(event: APIGatewayEvent): Promise<ProxyResult> {
        const dateRange = this.getDateRange(event);

        const connection = await this.db.getConnection();

        const data = await connection.createQueryBuilder(PaymentEntity, 'payment')
            .select(['payment.id', 'payment.userId', 'payment.createTime', 'payment.amount', 'payment.type', 'user.bTag'])
            .innerJoin('user', 'user', 'user.id = payment.userId AND user.bTag IS NOT NULL')
            .where({
                type: Not(PaymentType.Refund),
                status: PaymentStatus.Successful,
                createTime: Between(dateRange.from, dateRange.to)
            })
            .getRawMany();

        const transformer = new NumericTransformer();

        const response = {
            Sales: data.map(r => ({
                saleDate: moment(r.payment_createTime).toISOString(),
                bTag: r.user_bTag,
                playerId: r.payment_userId,
                deposits: r.payment_type === PaymentType.Subscription ? transformer.from(r.payment_amount) : undefined,
                otp: r.payment_type === PaymentType.Purchase ? transformer.from(r.payment_amount) : undefined
            }))
        };

        return {
            statusCode: 200,
            body: JSON.stringify(response)
        };
    }
}
