import { StatisticsIpCountryUserCount } from './statistics-ip-country-user-count';

export interface StatisticsIpUserRegistration extends StatisticsIpCountryUserCount {
    state: string;
    convertedCount: number;
}

export interface IpUserRegistrationStatisticsFilter {
    createdFrom: string;
    createdTo: string;
}