export interface LeaderboardPointConfigEventRule {
    description: string;
    points: number | 'input';
    count?: number;
    multiplier?: number | 'count';
}

export interface LeaderboardPointConfigEvent {
    resetCounts?: string[];
    rules: LeaderboardPointConfigEventRule[];
}

export interface LeaderboardPointConfig {
    [name: string]: LeaderboardPointConfigEvent;
}

/*

{
    'WIN': {
        resetCounts: ['LOSS'],
        rules: [
            {
                description: 'Winning = points'
                points: 'input'
            },
            {
                description: '2x Consecutive Win = 2x Winnings',
                points: 'input',
                count: 2,
                multiplier: 2
            }
        ]
    },
    'LOSS': {
        resetCounts: ['WIN'],
        rules: [
            {
                description: 'Loss = 10 points',
                points: 10,
            },
            {
                description: '5x Consecutive Loss = 100 points',
                points: 100,
                count: 5
            }
        ]
    },
    'SCATTER': {
        rules [
            {
                description: 'Scatter = 500 points',
                points: 500
            }
        ]
    }
}

{
    'WIN': {
        resetCounts: ['LOSS'],
        rules: [
            {
                description: 'Winning = points'
                points: 'input'
            },
            {
                description: '2x Consecutive Win = 2x Winnings',
                points: 'input',
                count: 2,
                multiplier: 2
            },
            {
                description: '4x Consecutive Win = 4x Winnings',
                points: 'input',
                count: 4,
                multiplier: 4
            }
        ]
    }
}

*/