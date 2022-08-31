export interface JackpotUpdateModel {
    name?: string;
    label?: string;
    seed?: number;
    contributionMultiplier?: number;
    contributionGroup?: string;
    maxContribution?: number | null;
    maxBalance?: number | null;
    splitPayout?: boolean;
}