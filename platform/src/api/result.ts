import { Response } from 'express';
import Handlebars from 'handlebars';
import fs from 'fs';
import { NotFoundError } from '../core';

export abstract class ApiResult {
    public abstract handle(response: Response): void;
}

export class RedirectResult extends ApiResult {
    constructor(
        private readonly url: string,
        private readonly permanent?: boolean) {
        super();
    }

    public handle(response: Response): void {
        response.redirect(this.url, this.permanent ? 301 : 302);
    }
}

export class HtmlResult extends ApiResult {
    constructor(
        public readonly filePath: string,
        public readonly data?: any) {
        super();
    }

    public handle(response: Response): void {
        if (!fs.existsSync(this.filePath))
            throw new NotFoundError(`File ${this.filePath} could not be found.`);

        let content = fs.readFileSync(this.filePath, 'utf-8');
        if (this.data) {
            const template = Handlebars.compile(content);
            content = template(this.data);
        }
        response.type('html').send(content);
    }
}

export class FileResult extends ApiResult {
    constructor(
        public readonly data: any,
        public readonly fileName: string,
        public readonly contentType: string) {
        super();
    }

    public handle(response: Response): void {
        response.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        response
            .type(this.contentType)
            .attachment(this.fileName)
            .send(this.data);
    }
}