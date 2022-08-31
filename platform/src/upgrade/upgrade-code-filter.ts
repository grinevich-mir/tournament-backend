import { PagedFilter } from '../core';
import { UpgradeCode } from './upgrade-code';

export interface UpgradeCodeFilter extends PagedFilter<UpgradeCode> {
    userId?: number;
    processed?: boolean;
    expired?: boolean;
}