import { PagedFilter } from '../core';
import { Referral } from './referral';

export interface ReferralFilter extends PagedFilter<Omit<Referral, 'referrer' | 'referee'>> {
}