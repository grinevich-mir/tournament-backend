import { UpgradeType } from './upgrade-type';
import { PagedFilter } from '../core';
import { Upgrade } from './upgrade';

export interface UpgradeFilter extends PagedFilter<Upgrade> {
    type?: UpgradeType;
    userId?: number;
}