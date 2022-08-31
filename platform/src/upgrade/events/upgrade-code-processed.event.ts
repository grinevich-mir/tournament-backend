import { PlatformEvent } from '../../core/events';
import { InventoryItem } from '../../inventory';
import { UpgradeCode } from '../upgrade-code';

export class UpgradeCodeProcessedEvent extends PlatformEvent {
    constructor(
        public readonly code: UpgradeCode,
        public readonly inventoryItems: InventoryItem[]) {
        super('UpgradeCode:Processed');
    }
}