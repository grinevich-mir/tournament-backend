import { NewUpgradeCode } from './new-upgrade-code';

export interface UpgradeCode extends NewUpgradeCode {
    processTime?: Date;
    processedBy?: string;
    inventoryItemIds: number[];
    createTime: Date;
}