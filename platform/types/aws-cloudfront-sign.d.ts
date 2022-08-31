declare module 'aws-cloudfront-sign' {
    import { Moment } from 'moment';

    export interface CFURLSignatureOptions {
        expireTime?: number | Date | Moment;
        ipRange?: string;
        keypairId: number;
        privateKeyString?: string;
        privateKeyPath?: string;
    }
    export interface CFRTMPUrl {
        rtmpServerPath: string;
        rtmpStreamName: string;
    }
    export function getSignedUrl(cfUrl: string, params: CFURLSignatureOptions): string;
    export function getSignedRTMPUrl(domainName: string, s3Key: string, params: CFURLSignatureOptions): CFRTMPUrl;
    export function getSignedCookies(url: string, params: CFURLSignatureOptions): any;
    export function normalizeBase64(str: string): string;
    export function normalizeSignature(sig: string): string;
}