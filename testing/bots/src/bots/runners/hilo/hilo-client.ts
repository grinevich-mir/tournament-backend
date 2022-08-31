import { Singleton, Inject } from '@tcom/platform/lib/core/ioc';
import { JoinResponse, RoundResponse, PlayResponse } from './interfaces';
import { ParameterStore, Config } from '@tcom/platform/lib/core';
import axios, { AxiosRequestConfig } from 'axios';

@Singleton
export class HiloClient {
    constructor(
        @Inject private readonly parameterStore: ParameterStore) {
    }

    public async join(gameId: number, token: string): Promise<JoinResponse> {
        const request = {
            operatorId: await this.getParameter('operator-key'),
            gameId
        };

        const config: AxiosRequestConfig = {
            headers: {
                token
            }
        };

        const baseUrl = await this.getParameter('api-host');

        try {
            const response = await axios.post<JoinResponse>(`https://${baseUrl}/game/join`, request, config);
            return response.data;
        } catch (err) {
            let msg = err.message;

            if (err.response && err.response.data && err.response.data.message)
                msg = err.response.data.message;

            throw new Error(msg);
        }
    }

    public async getRound(gameId: number, token: string, round: number): Promise<RoundResponse> {
        const config: AxiosRequestConfig = {
            headers: {
                'session-token': token
            }
        };

        const baseUrl = await this.getParameter('api-host');

        try {
            const response = await axios.get<RoundResponse>(`https://${baseUrl}/game/${gameId}/round/${round}`, config);
            return response.data;
        } catch (err) {
            let msg = err.message;

            if (err.response && err.response.data && err.response.data.message)
                msg = err.response.data.message;

            throw new Error(msg);
        }
    }

    public async play(gameId: number, token: string, round: number, direction: 0 | 1): Promise<PlayResponse> {
        const request = {
            gameId,
            roundNumber: round,
            direction
        };

        const config: AxiosRequestConfig = {
            headers: {
                'session-token': token
            }
        };

        const baseUrl = await this.getParameter('api-host');

        try {
            const response = await axios.post<PlayResponse>(`https://${baseUrl}/game/play`, request, config);
            return response.data;
        } catch (err) {
            let msg = err.message;

            if (err.response && err.response.data && err.response.data.message)
                msg = err.response.data.message;

            throw new Error(msg);
        }
    }

    private async getParameter(name: string, decrypt: boolean = false): Promise<string> {
        return this.parameterStore.get(`/${Config.stage}/integration/hilo/${name}`, decrypt, true);
    }
}