import { AdminController, Get, Route, Security, Tags, Post, Body } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { AuditResponse, GameEntryResponse, GameResponse, HiloClient } from '@tcom/platform/lib/integration/hilo';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { Parser } from 'json2csv';

@Tags('Integration HiLo')
@Route('integration/hilo')
@Security('admin', ['integration:hilo:read'])
@LogClass()
export class HiloController extends AdminController {
    constructor(
        @Inject private readonly client: HiloClient) {
        super();
    }

    /**
     * @summary Return all audit details for game
     */
    @Get('{id}/audit')
    public async audits(id: number): Promise<AuditResponse[]> {
        return this.client.getAudits(id);
    }

    /**
     * @summary Return audit details for user
     */
    @Get('{id}/audit/{userSecureId}')
    public async audit(id: number, userSecureId: string): Promise<AuditResponse[]> {
        return this.client.getAudit(id, userSecureId);
    }

    /**
     * @summary Return game details
     */
    @Get('{id}')
    public async game(id: number): Promise<GameResponse> {
        return this.client.getGame(id);
    }

    /**
     * @summary Return all game entry details
     */
    @Get('{id}/entry')
    public async gameEntries(id: number): Promise<GameEntryResponse[]> {
        return this.client.getGameEntries(id);
    }

    /**
     * @summary Return all game entries in CSV
     */
    @Get('{id}/csv')
    public async gameEntriesAsCSV(id: number): Promise<string> {
        const data = await this.client.getGameEntries(id);
        return new Parser().parse(data);
    }

    /**
     * @summary Return game entry details
     */
    @Get('{id}/entry/{userSecureId}')
    public async gameEntry(id: number, userSecureId: string): Promise<GameEntryResponse> {
        return this.client.getGameEntry(id, userSecureId);
    }

    /**
     * @summary Restarts a game
     */
    @Post('{id}/restart')
    public async restartGame(id: number): Promise<void> {
        await this.client.restartGame(id);
    }

    /**
     * @summary Updates a game state
     */
    @Post('{id}/state')
    public async updateGameState(id: number, @Body() stateInput: { state: number }): Promise<void> {
        await this.client.updateGameState(id, stateInput.state);
    }
}