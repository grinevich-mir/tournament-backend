import { PagedFilter } from '../core';

export interface StatisticsUserActivity {
    id: number;
    displayName: string;
    email: string;
    purchaseCount: number;
    purchaseAmount: number;
    withdrawalRequestCount: number;
    withdrawalRequestAmount: number;
    withdrawalCompleteCount: number;
    withdrawalCompleteAmount: number;
    prizeCount: number;
    prizeAmount: number;
    diamondsWon: number;
    diamondsPurchased: number;
    diamondsSpent: number;
    freePlays: number;
}

export interface UserActivityStatisticsFilter extends PagedFilter<StatisticsUserActivity> {
    createdFrom: string;
    createdTo: string;
    userId?: number;
    displayName?: string;
}