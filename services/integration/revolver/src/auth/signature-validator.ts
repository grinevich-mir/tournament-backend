import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { Config, ParameterStore, ForbiddenError } from '@tcom/platform/lib/core';
import { GameResponseModel, GameResponseCode } from '../models';
import sha1 from 'sha1';
import { GameRequest } from '../models/common';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass({ arguments: false, result: false })
export class SignatureValidator {
    constructor(
        @Inject private readonly parameterStore: ParameterStore) {
    }

    public async handle<T extends GameResponseModel<any>>(request: GameRequest, handler: () => Promise<T>): Promise<T> {
        const token = this.getToken(request);
        const alphabeticValues = this.getValues(request);
        const parameterKey = `/${Config.stage}/integration/revolver/operator-secret`;
        const secret = await this.parameterStore.get(parameterKey, true, true);

        if (await this.verify(token, secret, alphabeticValues))
            return handler();

        return {
            code: GameResponseCode.WrongSignature
        } as unknown as T;
    }

    public async validate(request: GameRequest): Promise<boolean> {
        const token = this.getToken(request);
        const alphabeticValues = this.getValues(request);
        const parameterKey = `/${Config.stage}/integration/revolver/operator-secret`;
        const secret = await this.parameterStore.get(parameterKey, true, true);
        return this.verify(token, secret, alphabeticValues);
    }

    private async verify(token: string, secret: string, alphabeticValues: string): Promise<boolean> {
        const expectedHash = this.generateHash(secret, alphabeticValues);

        if (token.toLowerCase() === expectedHash.toLowerCase())
            return true;

        Logger.error(`Request signature ${token} does not match expected hash of ${expectedHash}.`);
        Logger.info('Signature data', {
            alphabeticValues,
            requestHash: token,
            generatedHash: expectedHash
        });
        return false;
    }

    private getToken(request: GameRequest): string {
        const tokenString = request.sign;
        if (!tokenString)
            throw new ForbiddenError('Signature property was not supplied.');

        return String(tokenString);
    }

    private generateHash(secret: string, alphabeticValues: string): string {
        return sha1(alphabeticValues + secret);
    }

    private getValues(request: any): string {
        const values = [];

        const keys = Object.keys(request).filter(k => k !== 'sign');
        keys.sort();

        for (const key of keys) {
            const value = request[key];

            if (typeof value === 'object' || value === null)
                continue;

            values.push(value);
        }

        return values.join('');
    }
}
