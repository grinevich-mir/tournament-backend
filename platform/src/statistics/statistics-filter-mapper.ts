import { Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import { PaymentMethodType } from '../payment';
import { UserActivityStatisticsFilter } from './statistics-user-activity';
import { UserPaymentProvider, UserPaymentStatisticsFilter, UserPaymentTransactionStatus, UserPaymentTransactionType } from './statistics-user-payment';

@Singleton
@LogClass()
export class StatisticsFilterMapper {
    public mapUserPaymentFilter(
        createdFrom: string,
        createdTo: string,
        userId?: number,
        displayName?: string,
        email?: string,
        types?: UserPaymentTransactionType[],
        paymentMethodTypes?: PaymentMethodType[],
        providers?: UserPaymentProvider[],
        statuses?: UserPaymentTransactionStatus[],
        providerRef?: string,
        page: number = 1,
        pageSize: number = 20,
        order?: string,
        direction?: 'ASC' | 'DESC'): UserPaymentStatisticsFilter {
        const filter: UserPaymentStatisticsFilter = {
            userId,
            displayName,
            email,
            providerRef,
            createdFrom,
            createdTo,
            page,
            pageSize
        };

        if (order)
            filter.order = {
                [`${order}`]: direction || 'ASC'
            };

        if (types && types.length > 0)
            filter.types = types;

        if (paymentMethodTypes && paymentMethodTypes.length > 0)
            filter.paymentMethodTypes = paymentMethodTypes;

        if (providers && providers.length > 0)
            filter.providers = providers;

        if (statuses && statuses.length > 0)
            filter.statuses = statuses;

        return filter;
    }

    public mapUserActivityFilter(
        createdFrom: string,
        createdTo: string,
        userId?: number,
        displayName?: string,
        page?: number,
        pageSize?: number,
        order?: string,
        direction?: 'ASC' | 'DESC'): UserActivityStatisticsFilter {
        const filter: UserActivityStatisticsFilter = {
            createdFrom,
            createdTo,
            userId,
            displayName,
            page,
            pageSize
        };

        if (order)
            filter.order = {
                [`${order}`]: direction || 'ASC'
            };

        return filter;
    }
}