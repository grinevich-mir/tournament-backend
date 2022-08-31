import { Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { GameCustomMessage, GameCustomMessageModel, GameResponseCode, GameResponseModel } from '../models';
import { CustomErrorResponseType } from '../models/common';

@Singleton
@LogClass()
export class CustomErrorResponseFactory {
    public create(type: CustomErrorResponseType, message?: string): GameResponseModel<GameCustomMessageModel> {
        switch(type) {
            case CustomErrorResponseType.InsuffientCredit:
                return this.getResponseModel(GameResponseCode.InsufficientFunds, {
                    fatal: false,
                    title: 'Not Enough Credit',
                    text: `Woah! Looks like you’re trying to spin with too many coins. Please adjust your coin level to use up all your balance before the tournament ends. Good luck!`,
                    type: 'normal'
                }, message);

            case CustomErrorResponseType.InsufficientRounds:
                return this.getResponseModel(GameResponseCode.InsufficientFunds, {
                    fatal: false,
                    title: 'No More Rounds Left',
                    text: `Wow, looks like you've used all your rounds! Why not stick around and chat to other members whilst waiting for the next tournament to begin. Good luck!`,
                    type: 'normal'
                }, message);

            case CustomErrorResponseType.EntryComplete:
                return this.getResponseModel(GameResponseCode.TransactionDeclined, {
                    fatal: false,
                    title: 'No Chances Left',
                    text: `Wow, looks like you've used all your coins! Why not stick around and chat to other members whilst waiting for the next tournament to begin. Good luck!`,
                    type: 'normal',
                    buttons: []
                }, message);

            case CustomErrorResponseType.TournamentNotStarted:
                return this.getResponseModel(GameResponseCode.TransactionDeclined, {
                    fatal: false,
                    title: 'Tournament Not Started',
                    text: `It’s great to see you but you’re a bit early, this tournament hasn’t started yet. Please try again when the tournament starts.`,
                    type: 'normal'
                }, message);

            case CustomErrorResponseType.TournamentFinished:
                return this.getResponseModel(GameResponseCode.TransactionDeclined, {
                    fatal: false,
                    title: 'Tournament Finished',
                    text: `Time has got the better of us and this tournament has finished. Don’t worry the next one is just round the corner, make sure you join and good luck!`,
                    type: 'normal',
                    buttons: []
                }, message);
        }
    }

    private getResponseModel(code: GameResponseCode, msg: GameCustomMessage, message?: string): GameResponseModel<GameCustomMessageModel> {
        return {
            code,
            data: {
                msg
            },
            message
        };
    }
}