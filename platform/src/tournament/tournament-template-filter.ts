export interface TournamentTemplateFilter {
    region?: string;
    scheduleType?: 'manual' | 'cron';
    enabled?: boolean;
}