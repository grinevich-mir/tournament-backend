import { Singleton } from '@tcom/platform/lib/core/ioc';
import { ApiRequest } from '@tcom/platform/lib/api';
import multer from 'multer';

/* istanbul ignore next */
@Singleton
export class UploadProcessor {
    public async process(request: ApiRequest): Promise<void> {
        const multerSingle = multer().single('avatar');
        return new Promise((resolve, reject) => {
          multerSingle(request, undefined as any, async (error: any) => {
            if (error)
              reject(error);

            resolve();
          });
        });
    }
}