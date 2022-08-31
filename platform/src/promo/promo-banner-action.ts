import { PromoBannerActionType } from './promo-banner-action-type';

export interface PromoBannerNavigateAction {
    type: PromoBannerActionType.Navigate;
    page: string;
}

export interface PromoBannerExternalLinkAction {
    type: PromoBannerActionType.ExternalLink;
    url: string;
}

export interface PromoBannerModalAction {
    type: PromoBannerActionType.Modal;
    modal: string;
}

export type PromoBannerAction = PromoBannerNavigateAction | PromoBannerExternalLinkAction | PromoBannerModalAction;