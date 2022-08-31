import { HttpClient } from './http-client';
import { CreateLobbyRequest, CreateLobbyResponse, GetPatternsResponse, PatternMap } from './interfaces';
import { Singleton, Inject } from '../../core/ioc';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class TambolaClient {
    constructor(
        @Inject private readonly http: HttpClient) {
    }

    public async createGame(request: CreateLobbyRequest): Promise<string> {
        const response = await this.http.post<CreateLobbyResponse>('createLobby', request);
        return response.gameId;
    }

    public async getPatterns(): Promise<PatternMap> {
        const response = await this.http.get<GetPatternsResponse>('config/getPatterns');
        return response.patterns;
    }

    public async getAudits(gameId: number): Promise<any[]> {
        return this.http.get(`admin/${gameId}/audit`);
    }

    public async getAudit(gameId: number, playerId: string): Promise<any[]> {
        return this.http.get(`admin/${gameId}/audit/${playerId}`);
    }

    public async getGame(gameId: number): Promise<any> {
        return this.http.get(`admin/${gameId}`);
    }

    public async getGameEntries(gameId: number): Promise<any[]> {
        return this.http.get(`admin/${gameId}/entry`);
    }

    public async getGameEntry(gameId: number, playerId: string): Promise<any> {
        return this.http.get(`admin/${gameId}/entry/${playerId}`);
    }
}
