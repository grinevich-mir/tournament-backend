import { describe, it } from '@tcom/test';
import { mock, when, instance, verify, deepEqual, mockUserRequest, reset, mockUser } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { InventoryManager, InventoryItem, InventoryFilter, InventoryItemType, InventoryGetAllFilter } from '@tcom/platform/lib/inventory';
import { InventoryController } from '../../src/controllers/inventory.controller';
import { InventoryModelMapper, InventoryItemModel } from '@tcom/platform/lib/inventory/models';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { User, UserType } from '@tcom/platform/lib/user';

describe('InventoryController', () => {
    const mockManager = mock(InventoryManager);
    const mockMapper = mock(InventoryModelMapper);

    function getController(): InventoryController {
        return new InventoryController(
            instance(mockManager),
            instance(mockMapper));
    }

    beforeEach(() => {
        reset(mockManager);
        reset(mockMapper);
    });

    describe('getAll()', () => {
        it('should return inventory items', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const claimed = false;
            const expired = false;
            const page = 1;
            const pageSize = 20;

            const filter: InventoryGetAllFilter = {
                userId,
                claimed,
                expired,
                enabled: true,
                page,
                pageSize,
                order: {
                    createTime: 'DESC'
                }
            };
            const inventoryItems: InventoryItem[] = [];
            const models: InventoryItemModel[] = [];

            when(mockManager.getAll(deepEqual(filter))).thenResolve(new PagedResult(inventoryItems, 1, page, pageSize));
            when(mockMapper.mapAll(inventoryItems)).thenReturn(models);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getAll(claimed, expired);

            // Then
            expect(result.items).to.equal(models);
            verify(mockManager.getAll(deepEqual(filter))).once();
            verify(mockMapper.mapAll(inventoryItems)).once();
        });
    });

    describe('get()', () => {
        it('should throw a not found error when the item does not exist', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const itemId = 1;

            when(mockManager.get(itemId)).thenResolve(undefined);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.get(itemId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Inventory item not found');
        });

        it('should return an inventory item', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const inventoryItem: InventoryItem = {
                id: 1,
                userId,
                type: InventoryItemType.Upgrade,
                claimed: false,
                level: 1,
                validDays: 30,
                expires: new Date(),
                enabled: true,
                createTime: new Date()
            };

            const models: InventoryItemModel = {
                id: 1,
                type: InventoryItemType.Upgrade,
                claimed: false,
                level: 1,
                validDays: 30,
                createTime: new Date(),
                expires: new Date()
            };

            when(mockManager.get(inventoryItem.id)).thenResolve(inventoryItem);
            when(mockMapper.map(inventoryItem)).thenReturn(models);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.get(inventoryItem.id);

            // Then
            expect(result).to.equal(models);
            verify(mockManager.get(inventoryItem.id)).once();
            verify(mockMapper.map(inventoryItem)).once();
        });
    });

    describe('count()', () => {
        it('should return unclaimed and unexpired inventory item count', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const expectedCount = 5;

            const filter: InventoryFilter = {
                userId,
                claimed: false,
                expired: false,
                enabled: true
            };

            when(mockManager.count(deepEqual(filter))).thenResolve(expectedCount);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.count();

            // Then
            expect(result.count).to.equal(expectedCount);
        });
    });

    describe('claim()', () => {
        it('should claim the item and set a 200 status', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const itemId = 1;
            const userType = UserType.Standard;

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            await controller.claim(itemId);

            // Then
            expect(controller.getStatus()).to.equal(200);
            verify(mockManager.claimForUser(itemId, userId)).once();
        });
    });
});