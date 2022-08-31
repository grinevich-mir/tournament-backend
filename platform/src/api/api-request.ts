import { Request } from 'express';
import { GeoIpInfo } from '../core';

export interface ApiRequest extends Request {
    geoIp?: GeoIpInfo;
}