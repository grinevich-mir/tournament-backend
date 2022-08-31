import { Singleton, Inject } from '../../../core/ioc';
import { GameUrlResolver } from '../game-url-resolver';
import { ParameterStore, Config, DeviceType, URLBuilder } from '../../../core';
import { GameSession } from '../../game-session';
import { Game } from '../../game';
import axios, { AxiosError } from 'axios';
import Logger, { LogClass } from '../../../core/logging';

interface RevolverResponse {
    code: number;
    data: {
        URL: string
    };
    message?: string;
}

interface RevolverError {
    code: number;
    data: any[];
    message: string;
}

@Singleton
@LogClass()
export class RevolverGameUrlResolver implements GameUrlResolver {
    constructor(
        @Inject private readonly parameterStore: ParameterStore) {
        }

    public async resolve(game: Game, session: GameSession, deviceType?: DeviceType): Promise<string> {
        // https://gap-launcher-stage.revolvergaming.com/v1/launch/generic?operator=17db35965d1111eabc550242ac130003&game=63ae017eb84911e896f8529269fb1459&token=${session.secureId}&lang=${lang}&redirect=true

        const apiHost = await this.parameterStore.get(`/${Config.stage}/integration/revolver/api-host`, false, true);
        const operatorId = await this.parameterStore.get(`/${Config.stage}/integration/revolver/operator-id`, false, true);
        const baseUrl = `https://${apiHost}/v1/launch/generic`;

        const builder = new URLBuilder(baseUrl)
            .setQueryParams({
                operator: operatorId,
                game: game.providerRef,
                token: session.secureId,
                lang: session.language,
                skin: 'trnmnt'
            });

        const variant = this.getVariant(deviceType);

        if (variant)
            builder.setQueryParam('variant', variant);

        const url = builder.toString();

        Logger.info(`Calling Revolver launch endpoint ${url}...`);

        try {
            const response = await axios.get<RevolverResponse>(url);
            Logger.info('Revolver launch response', response.data);

            if (response.data.code !== 200)
                throw new Error(response.data.message);

            const launchUrl = new URLBuilder(response.data.data.URL).deleteQueryParam('regulation');
            return launchUrl.toString();
        } catch (err) {
            const axiosError = err as AxiosError;
            const revolverError = axiosError.response?.data as RevolverError;

            if (revolverError) {
                Logger.warn('Revolver Launch Error', {
                    code: revolverError.code,
                    message: revolverError.message,
                    data: revolverError.data
                });
                throw new Error(revolverError.message);
            }

            throw err;
        }
    }

    private getVariant(deviceType?: DeviceType): string | undefined {
        switch (deviceType) {
            case DeviceType.Desktop:
                return 'desktop';

            case DeviceType.Mobile:
                return 'mobile';
        }

        return undefined;
    }
}