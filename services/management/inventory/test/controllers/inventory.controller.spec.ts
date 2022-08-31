import { describe, it } from '@tcom/test';
import { mock, when, instance, verify } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { InventoryController } from '../../src/controllers/inventory.controller';
import { DiamondInventoryItem, InventoryItemType, InventoryManager, NewInventoryItem } from '@tcom/platform/lib/inventory';

describe('InventoryController', () => {
    const mockInventoryManager = mock(InventoryManager);

    function getController(): InventoryController {
        return new InventoryController(instance(mockInventoryManager));
    }

    beforeEach(() => mockInventoryManager);

    describe('add()', () => {
        const item: NewInventoryItem = {
            type: InventoryItemType.Diamonds,
            amount: 10,
            userId: 1,
        };

        const diamondInventoryItem: DiamondInventoryItem = {
            type: InventoryItemType.Diamonds,
            amount: 10,
            id: 1,
            userId: 1,
            claimed: false,
            enabled: true,
            createTime: new Date(),
        };

        it('should add new item to users inventory', async () => {
            // Given
            when(mockInventoryManager.add(item)).thenResolve(diamondInventoryItem);

            const controller = getController();

            // When
            const result = await controller.add(item);

            // Then
            expect(result.type).to.equal('Diamonds');
            verify(mockInventoryManager.add(item)).once();
        });
    });
});