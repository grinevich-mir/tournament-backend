export enum TournamentState {
    Scheduled = 1,
    Launching = 2,
    Waiting = 3,
    Running = 4,
    Finalising = 5,
    Ended = 6,
    Cancelled = 7,
    Failed = 8
}

export const TournamentStateGroups = {
    Active: [TournamentState.Scheduled, TournamentState.Launching, TournamentState.Waiting, TournamentState.Running, TournamentState.Finalising],
    Scheduled: [TournamentState.Scheduled, TournamentState.Launching, TournamentState.Waiting],
    Running: [TournamentState.Running, TournamentState.Finalising],
    Ended: [TournamentState.Ended, TournamentState.Cancelled, TournamentState.Failed]
};