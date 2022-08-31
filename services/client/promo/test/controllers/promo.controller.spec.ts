import { PromoController } from '../../src/controllers/promo.controller';
import { PromoBannerManager, PromoBanner } from '@tcom/platform/lib/promo';

import { describe, it } from '@tcom/test';
import { mock, instance, when, reset } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';

describe('PromoController', () => {
    const mockManager = mock(PromoBannerManager);

    function getController(): PromoController {
        return new PromoController(instance(mockManager));
    }

    beforeEach(() => {
        reset(mockManager);
    });

    describe('getBanners()', () => {
        it('should return banners', async () => {
            // Given
            const expectedBanners: PromoBanner[] = [
                {
                    id: 1,
                    imageUrl: 'http://animage.com/url.jpg'
                },
                {
                    id: 2,
                    imageUrl: 'http://animage.com/url2.jpg'
                }
            ];

            when(mockManager.getAll()).thenResolve(expectedBanners);

            const controller = getController();

            // When
            const banners = await controller.getBanners();

            // Then
            expect(banners).to.be.lengthOf(expectedBanners.length);
            expect(banners).to.equal(banners);
        });
    });
});