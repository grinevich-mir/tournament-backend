import { PromoBannerAction } from './promo-banner-action';

export interface PromoBanner {
    id: number;
    imageUrl: string;
    action?: PromoBannerAction;
}