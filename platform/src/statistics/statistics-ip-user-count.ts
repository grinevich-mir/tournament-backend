import { GeoIpInfo } from '../core';

export interface StatisticsIpUserCount extends GeoIpInfo {
    userCount: number;
}