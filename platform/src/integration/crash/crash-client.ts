import { Singleton, Inject } from '../../core/ioc';
import { HttpClient } from './http-client';
import { AuditResponse, CreateLobbyRequest, CreateLobbyResponse, GameEntryResponse, GameResponse } from './interfaces';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class CrashClient {
    constructor(
        @Inject private readonly http: HttpClient) {
    }

    public async createGame(request: CreateLobbyRequest): Promise<string> {
        const response = await this.http.post<CreateLobbyResponse>('lobby/createLobby', request);
        return response.gameId;
    }

    public async launchGame(id: string): Promise<void> {
        await this.http.get('launchGame', { gameId: id });
    }

    public async getAudits(gameId: number): Promise<AuditResponse[]> {
        return this.http.get(`admin/${gameId}/audit`);
    }

    public async getAudit(gameId: number, playerId: string): Promise<AuditResponse[]> {
        return this.http.get(`admin/${gameId}/audit/${playerId}`);
    }

    public async getGame(gameId: number): Promise<GameResponse> {
        return this.http.get(`admin/${gameId}`);
    }

    public async getGameEntries(gameId: number): Promise<GameEntryResponse[]> {
        return this.http.get(`admin/${gameId}/entry`);
    }

    public async getGameEntry(gameId: number, playerId: string): Promise<GameEntryResponse> {
        return this.http.get(`admin/${gameId}/entry/${playerId}`);
    }
}
