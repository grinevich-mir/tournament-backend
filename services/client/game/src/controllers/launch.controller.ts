import { Get, Route, Path, Security, ClientController, Query, Hidden, HtmlResult } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { GameSessionManager } from '@tcom/platform/lib/game';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { DeviceType } from '@tcom/platform/lib/core';

@Route('game')
@LogClass()
export class LaunchController extends ClientController {
    constructor(
        @Inject private readonly sessionManager: GameSessionManager) {
        super();
    }

    /**
     * @summary Start a game session
     */
    @Hidden()
    @Security('cognito')
    @Get('start/{gameId}')
    public async launch(
        @Path() gameId: number,
        @Query() currency: string,
        @Query() lang: string,
        @Query() deviceType?: DeviceType): Promise<HtmlResult> {
        try {
            const result = await this.sessionManager.start(gameId, this.user.id, currency, lang, undefined, deviceType);
            return this.html('static/redirect.html', {
                url: result.redirectUrl
            });
        } catch (err) {
            Logger.error(err);
            this.setStatus(err.status || 500);
            return this.html('static/error.html', err);
        }
    }

    /**
     * @summary Play the specified game session
     */
    @Hidden()
    @Get('play/{id}')
    public async play(
        @Path() id: string,
        @Query() deviceType?: DeviceType): Promise<HtmlResult> {
        try {
            const result = await this.sessionManager.resume(id, deviceType);
            return this.html('static/redirect.html', {
                url: result.redirectUrl
            });
        } catch (err) {
            Logger.error(err);
            this.setStatus(err.status || 500);
            return this.html('static/error.html', err);
        }
    }
}
