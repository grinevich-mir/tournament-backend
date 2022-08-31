export interface GeoIpInfo {
    ip: string;
    country?: string;
    city?: string;
    region?: string;
    regionCode?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
}