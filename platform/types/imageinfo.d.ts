declare module 'imageinfo' {
    export interface ImageInfo {
        mimeType: string;
        width: number;
        height: number;
    }

    export default function(buffer: Buffer): ImageInfo | false;
}