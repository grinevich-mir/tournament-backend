import { Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { URLBuilder } from '../../core';
import { VoluumEvents } from './voluum-events';
import axios, { AxiosError } from 'axios';

const headers = {
    'content-type': 'application/json',
};

@Singleton
@LogClass()
export class Voluum {
    private readonly baseUrl = `https://track.tournament.com/postback?`;

    public async sendRegEvent(clickId: string): Promise<void> {
        const url = new URLBuilder(this.baseUrl)
            .setQueryParams({
                cid: clickId,
                et: VoluumEvents.REG
            }).toString();

        try {
            await axios.post(url, {}, { headers });
        } catch (error) {
            const axiosError = error as AxiosError;
            throw axiosError;
        }
    }

    public async sendPurchaseEvent(clickId: string, payout: string, txid?: string): Promise<void> {
        const url = new URLBuilder(this.baseUrl)
            .setQueryParams({
                cid: clickId,
                payout,
                ...(txid && { txid }),
                et: VoluumEvents.PURCHASE
            }).toString();

        try {
            await axios.post(url, {}, { headers });
        } catch (error) {
            const axiosError = error as AxiosError;
            throw axiosError;
        }
    }

}