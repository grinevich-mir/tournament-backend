import { GeoIpInfo } from '../core';

export interface UserIp extends GeoIpInfo {
    id: number;
    userId: number;
    createTime: Date;
}