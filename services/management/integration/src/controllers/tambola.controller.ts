import { AdminController, Get, Route, Security, Tags } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { TambolaClient } from '@tcom/platform/lib/integration/tambola';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Tags('Integration Bingo')
@Route('integration/bingo')
@Security('admin', ['integration:tambola:read'])
@LogClass()
export class TambolaController extends AdminController {
    constructor(
        @Inject private readonly client: TambolaClient) {
        super();
    }

    /**
     * @summary Return all audit details for game
     */
    @Get('{id}/audit')
    public async audits(id: number): Promise<any[]> {
        return this.client.getAudits(id);
    }

    /**
     * @summary Return audit details for user
     */
    @Get('{id}/audit/{userSecureId}')
    public async audit(id: number, userSecureId: string): Promise<any[]> {
        return this.client.getAudit(id, userSecureId);
    }

    /**
     * @summary Return game details
     */
    @Get('{id}')
    public async game(id: number): Promise<any> {
        return this.client.getGame(id);
    }

    /**
     * @summary Return all game entry details
     */
    @Get('{id}/entry')
    public async gameEntries(id: number): Promise<any[]> {
        return this.client.getGameEntries(id);
    }

    /**
     * @summary Return game entry details
     */
    @Get('{id}/entry/{userSecureId}')
    public async gameEntry(id: number, userSecureId: string): Promise<any> {
        return this.client.getGameEntry(id, userSecureId);
    }
}