import { Singleton, Inject } from '../core/ioc';
import { PromoBannerRepository } from './repositories';
import { PromoBanner } from './promo-banner';
import { LogClass } from '../core/logging';

@Singleton
@LogClass()
export class PromoBannerManager {
    constructor(
        @Inject private readonly repository: PromoBannerRepository) {
        }

    public async getAll(): Promise<PromoBanner[]> {
        return this.repository.getAll();
    }
}