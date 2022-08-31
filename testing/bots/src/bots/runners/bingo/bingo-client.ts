import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { ParameterStore, Config } from '@tcom/platform/lib/core';
import axios from 'axios';

@Singleton
export class BingoClient {
    constructor(
        @Inject private readonly parameterStore: ParameterStore) {
    }

    public async join(gameId: number, token: string): Promise<void> {
        const baseUrl = await this.getParameter('api-host');
        const operatorId = await this.getParameter('operator-key');
        const url = `https://${baseUrl}/v1/bingoLauncher?operator=${operatorId}&auth_token=${token}&game_id=${gameId}&redirect=${encodeURIComponent(`https://game1.${Config.stage}.bingo.tgaming.io`)}`;
        await axios.get(url);
    }

    private async getParameter(name: string, decrypt: boolean = false): Promise<string> {
        return this.parameterStore.get(`/${Config.stage}/integration/tambola/${name}`, decrypt, true);
    }
}