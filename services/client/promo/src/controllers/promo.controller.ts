import { Get, Route, Tags, ClientController } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { PromoBannerManager, PromoBanner } from '@tcom/platform/lib/promo';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Route('promo')
@LogClass()
export class PromoController extends ClientController {
    constructor(
        @Inject private readonly manager: PromoBannerManager) {
            super();
    }

    /**
     * @summary Gets all promo banners
     */
    @Tags('Banners')
    @Get('banner')
    public async getBanners(): Promise<PromoBanner[]> {
        return this.manager.getAll();
    }
}
