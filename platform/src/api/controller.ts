import { Controller as TsoaController } from 'tsoa/dist/interfaces/controller';
import { FileResult, HtmlResult, RedirectResult } from './result';
import path from 'path';
import { ApiRequest } from './api-request';

export class Controller<TRequest extends ApiRequest = ApiRequest> extends TsoaController {
    protected _request!: TRequest;
    protected _content?: any;
    protected _contentType?: string;

    public get request(): TRequest {
        return this._request;
    }

    public setRequest(request: TRequest): void {
        this._request = request;
    }

    public html(filePath: string, data?: any): HtmlResult {
        filePath = path.resolve(filePath);
        return new HtmlResult(filePath, data);
    }

    public redirect(url: string, permanent?: boolean) {
        return new RedirectResult(url, permanent);
    }

    public file(data: any, fileName: string, contentType: string): FileResult {
        return new FileResult(data, fileName, contentType);
    }
}