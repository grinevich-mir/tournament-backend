import { Singleton } from '../../core/ioc';
import { Config } from '../../core';
import { PromoBanner } from '../promo-banner';
import { PromoBannerActionType } from '../promo-banner-action-type';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class PromoBannerRepository {
    public async getAll(): Promise<PromoBanner[]> {
        return [
            {
                id: 1,
                imageUrl: `https://content.${Config.domain}/banners/rog.jpg`,
                action: {
                    type: PromoBannerActionType.ExternalLink,
                    url: 'https://www.google.com'
                }
            },
            {
                id: 2,
                imageUrl: `https://content.${Config.domain}/banners/mm.jpg`,
                action: {
                    type: PromoBannerActionType.Modal,
                    modal: 'SignUp'
                }
            }
        ];
    }
}