import { Singleton, Inject } from '../core/ioc';
import { PagedResult, NotFoundError } from '../core';
import { LogClass } from '../core/logging';
import { TournamentIntroRepository } from './repositories';
import { TournamentIntro } from './tournament-intro';
import { TournamentIntroUpdate } from './tournament-intro-update';
import { TournamentIntroCache } from './cache';
import { TournamentIntroFilter } from './tournament-intro-filter';

@Singleton
@LogClass()
export class TournamentIntroManager {
    constructor(
        @Inject private readonly repository: TournamentIntroRepository,
        @Inject private readonly cache: TournamentIntroCache) {
    }

    public async get(id: number): Promise<TournamentIntro> {
        const cachedIntro = await this.cache.get(id);

        if (cachedIntro)
            return cachedIntro;

        const intro = await this.repository.get(id);

        if (!intro)
            throw new NotFoundError(`Tournament intro not found for Id ${id}`);

        return intro;
    }

    public async getActive(id: number): Promise<TournamentIntro> {
        const intro = await this.get(id);

        if (!intro.enabled)
            throw new Error(`Tournament intro ${id} is disabled`);

        return intro;
    }

    public async getAll(filter?: TournamentIntroFilter): Promise<PagedResult<TournamentIntro>> {
        return this.repository.getAll(filter);
    }

    public async add(update: TournamentIntroUpdate): Promise<TournamentIntro> {
        const intro = await this.repository.add(update);
        await this.cache.store(intro);
        return intro;
    }

    public async update(id: number, update: TournamentIntroUpdate): Promise<TournamentIntro> {
        const intro = await this.repository.update(id, update);

        if (intro.enabled)
            await this.cache.store(intro);
        else
            await this.cache.remove(id);

        return intro;
    }
}