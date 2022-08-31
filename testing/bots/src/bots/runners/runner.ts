import { Bot } from '../bot';
import { Tournament, TournamentEntry } from '@tcom/platform/lib/tournament';

export abstract class Runner {
    public running = false;

    public bot!: Bot;
    public tournament!: Tournament;
    public entry!: TournamentEntry;

    public abstract async start(): Promise<void>;
    public abstract async stop(): Promise<void>;
    public dispose(): void {
        delete this.bot;
        delete this.tournament;
        delete this.entry;
    }

    protected log(...messages: string[]): void {
        console.log(`Bot: ${this.bot.user.id}:`, ...messages);
    }
}