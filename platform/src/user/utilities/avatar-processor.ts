import { Singleton } from '../../core/ioc';
import AWS from 'aws-sdk';
import request from 'request-promise';
import { ForbiddenError, DEFAULT_REGION } from '../../core';
import uuid from 'uuid/v4';
import env from 'env-var';
import filesize from 'filesize';
import imageinfo from 'imageinfo';
import Logger, { LogClass } from '../../core/logging';

const ALLOWED_DIMENSIONS = 320;
const MAX_FILE_SIZE_BYTES = 102400;

interface ImageData {
    buffer: Buffer;
    width: number;
    height: number;
    mimeType: string | undefined;
}

@Singleton
@LogClass({ arguments: false, result: false })
export class AvatarProcessor {
    public async processUrl(url: string, validate: boolean = true, moderate: boolean = true): Promise<string> {
        const buffer = await this.downloadImage(url);

        if (!buffer || buffer.length === 0)
            throw new Error('Failed to download image, response was empty.');

        return this.processBuffer(buffer, validate, moderate);
    }

    public async processBuffer(buffer: Buffer, validate: boolean = true, moderate: boolean = true): Promise<string> {
        const info = this.getInfo(buffer);

        if (validate)
            await this.validate(info);

        return this.process(info, moderate);
    }

    public async delete(id: string): Promise<void> {
        const s3 = new AWS.S3({ region: DEFAULT_REGION });
        await s3.deleteObject({
            Bucket: env.get('CONTENT_BUCKET').required().asString(),
            Key: `avatars/custom/${id}`
        }).promise();
    }

    private async process(data: ImageData, moderate: boolean): Promise<string> {
        if (moderate)
            await this.moderate(data);

        return this.save(data);
    }

    private async moderate(data: ImageData): Promise<void> {
        Logger.info('Moderating image...', data);
        const rek = new AWS.Rekognition();
        const response = await rek.detectModerationLabels({
            MinConfidence: 80,
            Image: {
                Bytes: data.buffer
            }
        }).promise();

        if (response.ModerationLabels && response.ModerationLabels.length > 0) {
            Logger.info('Moderation labels found:', JSON.stringify(response.ModerationLabels));
            const labelNames = response.ModerationLabels.map(l => l.Name);

            if (labelNames.includes('Explicit Nudity'))
                throw new ForbiddenError('Avatar must not contain nudity.');
        }
    }

    private async save(data: ImageData): Promise<string> {
        const avatarId = uuid();
        const s3 = new AWS.S3({ region: DEFAULT_REGION });

        await s3.putObject({
            Bucket: env.get('CONTENT_BUCKET').required().asString(),
            Key: `avatars/custom/${avatarId}`,
            Body: data.buffer,
            ContentType: data.mimeType
        }).promise();

        return avatarId;
    }

    private async downloadImage(url: string): Promise<Buffer> {
        Logger.info(`Downloading image from ${url}...`);
        const res = await request({
            url,
            encoding: null
        }) as Buffer;

        return res;
    }

    private async validate(data: ImageData): Promise<void> {
        const buffer = data.buffer;

        if (buffer.byteLength > MAX_FILE_SIZE_BYTES)
            throw new ForbiddenError(`File must not be more than ${filesize(MAX_FILE_SIZE_BYTES)}.`);

        if (data.width !== ALLOWED_DIMENSIONS || data.height !== ALLOWED_DIMENSIONS)
            throw new ForbiddenError(`Image must be ${ALLOWED_DIMENSIONS}x${ALLOWED_DIMENSIONS}.`);
    }

    private getInfo(buffer: Buffer): ImageData {
        const info = imageinfo(buffer);

        if (!info || !['image/jpeg', 'image/png'].includes(info.mimeType))
            throw new ForbiddenError('Invalid image format.');

        return {
            mimeType: info.mimeType,
            buffer,
            width: info.width,
            height: info.height
        };
    }
}