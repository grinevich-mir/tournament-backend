import { User, UserType } from '@tcom/platform/lib/user';
import { describe } from '@tcom/test';
import { expect } from '@tcom/test/assert';
import { deepEqual, instance, mock, mockUser, mockUserRequest, reset, when } from '@tcom/test/mock';
import { StoreFilter } from '@tcom/platform/lib/store';
import { StoreManager } from '@tcom/platform/lib/store/store-manager';
import { StoreController } from '../../src/controllers/store.controller';
import { StoreItem } from '@tcom/platform/lib/store/store-item';
import { StoreItemType } from '@tcom/platform/lib/store/store-item-type';
import { Order } from '@tcom/platform/lib/order';
import { OrderStoreItemModel } from '../../src/models';

describe('StoreController', () => {
    const mockStoreManager = mock(StoreManager);

    function getController(): StoreController {
        return new StoreController(
            instance(mockStoreManager));
    }

    beforeEach(() => {
        reset(mockStoreManager);
    });

    describe('getActive()', async () => {
        it('should return an empty result when there are no items', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const level = 1;

            const filter: StoreFilter = {
                level,
                public: true,
                enabled: true,
                type: undefined,
            };

            const items: StoreItem[] = [];
            when(mockStoreManager.getActive(deepEqual(filter))).thenResolve(items);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType,
                    level
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getAll();

            // Then
            expect(result.items).to.equal(items);
        });
    });

    describe('get()', async () => {
        it('should return an item', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const level = 1;

            const item: StoreItem = {
                id: 1,
                name: 'test',
                type: StoreItemType.Diamonds,
                price: 1,
                minLevel: 1,
                maxLevel: 1,
                quantity: 1,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };
            when(mockStoreManager.get(1)).thenResolve(item);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType,
                    level
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.get(1);

            // Then
            expect(result).to.equal(item);
        });
    });

    describe('order()', async () => {
        it('should order an item', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const level = 1;
            const itemId = 1;

            when(mockStoreManager.order(userId, itemId)).thenResolve({} as Order);

            const params: OrderStoreItemModel = {
                itemId
            };

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType,
                    level
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.order(params);

            // Then
            expect(result).to.equal(null);
        });
    });
});