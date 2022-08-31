import { describe, it } from '@tcom/test';
import { expect } from '@tcom/test/assert';
import { User } from '@tcom/platform/lib/user';
import { TournamentIntro } from '@tcom/platform/lib/tournament';
import { TournamentIntroModel, UserTournamentModel } from '@tcom/platform/lib/tournament/models';
import { TournamentIntroCompiler } from '@tcom/platform/lib/tournament/utilities';

describe('TournamentIntroCompiler', () => {
    describe('compile()', () => {
        it('should replace expressions with input data', () => {
            // Given
            const tournament: UserTournamentModel = {
                id: 1,
                name: 'Hi-Lo Mega Win'
            } as UserTournamentModel;

            const user: User = {
                displayName: 'Test User'
            } as User;

            const tournamentIntro: TournamentIntro = {
                id: 1,
                name: 'Test',
                topContent: 'Hello, my name is {{user.displayName}}',
                bottomContent: 'I hope you enjoy playing our {{tournament.name}} tournament',
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const tournamentIntroModel: TournamentIntroModel = {
                topContent: 'Hello, my name is Test User',
                bottomContent: 'I hope you enjoy playing our Hi-Lo Mega Win tournament'
            };

            const compiler = new TournamentIntroCompiler();

            // When
            const result = compiler.compile(tournamentIntro, { tournament, user });

            // Then
            expect(result).to.deep.equal(tournamentIntroModel);
        });

        it('should pluralise expression correctly', () => {
            // Given
            const tournament: UserTournamentModel = {} as UserTournamentModel;
            const user: User = {} as User;
            const tournamentIntro: TournamentIntro = {
                id: 1,
                name: 'Test',
                topContent: 'You have 10 {{pluralise 10 "chance" "chances"}} to build your high score',
                bottomContent: '',
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const tournamentIntroModel: TournamentIntroModel = {
                topContent: 'You have 10 chances to build your high score',
                bottomContent: ''
            };

            const compiler = new TournamentIntroCompiler();

            // When
            const result = compiler.compile(tournamentIntro, { tournament, user });

            // Then
            expect(result).to.deep.equal(tournamentIntroModel);
        });

        it('should singularise expression correctly', () => {
            // Given
            const tournament: UserTournamentModel = {} as UserTournamentModel;
            const user: User = {} as User;
            const tournamentIntro: TournamentIntro = {
                id: 1,
                name: 'Test',
                topContent: 'You have 1 {{pluralise 1 "chance" "chances"}} to build your high score',
                bottomContent: '',
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const tournamentIntroModel: TournamentIntroModel = {
                topContent: 'You have 1 chance to build your high score',
                bottomContent: ''
            };

            const compiler = new TournamentIntroCompiler();

            // When
            const result = compiler.compile(tournamentIntro, { tournament, user });

            // Then
            expect(result).to.deep.equal(tournamentIntroModel);
        });

        it('should replace if block helper correctly', () => {
            // Given
            const tournament: UserTournamentModel = {
                playerAllocationsRemaining: 5
            } as UserTournamentModel;

            const user: User = {} as User;
            const topContent = `{{#if tournament.playerAllocationsRemaining}}You have 5 chances to build your high score{{else}}You have no more chances to build your high score{{/if}}`;
            const tournamentIntro: TournamentIntro = {
                id: 1,
                name: 'Test',
                topContent,
                bottomContent: '',
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const tournamentIntroModel: TournamentIntroModel = {
                topContent: 'You have 5 chances to build your high score',
                bottomContent: ''
            };

            const compiler = new TournamentIntroCompiler();

            // When
            const result = compiler.compile(tournamentIntro, { tournament, user });

            // Then
            expect(result).to.deep.equal(tournamentIntroModel);
        });

        it('should replace else block helper correctly', () => {
            // Given
            const tournament: UserTournamentModel = {} as UserTournamentModel;
            const user: User = {} as User;
            const topContent = `{{#if tournament.playerAllocationsRemaining}}You have 5 chances to build your high score{{else}}You have no more chances to build your high score{{/if}}`;
            const tournamentIntro: TournamentIntro = {
                id: 1,
                name: 'Test',
                topContent,
                bottomContent: '',
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const tournamentIntroModel: TournamentIntroModel = {
                topContent: 'You have no more chances to build your high score',
                bottomContent: ''
            };

            const compiler = new TournamentIntroCompiler();

            // When
            const result = compiler.compile(tournamentIntro, { tournament, user });

            // Then
            expect(result).to.deep.equal(tournamentIntroModel);
        });

        it('should replace exists block helper correctly', () => {
            // Given
            const tournament: UserTournamentModel = {} as UserTournamentModel;
            const user: User = {} as User;
            const topContent = `{{#exists tournament.playerAllocationsRemaining}}Exists{{else}}Does not exist{{/exists}}`;
            const tournamentIntro: TournamentIntro = {
                id: 1,
                name: 'Test',
                topContent,
                bottomContent: '',
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const tournamentIntroModel: TournamentIntroModel = {
                topContent: 'Does not exist',
                bottomContent: ''
            };

            const compiler = new TournamentIntroCompiler();

            // When
            const result = compiler.compile(tournamentIntro, { tournament, user });

            // Then
            expect(result).to.deep.equal(tournamentIntroModel);
        });

        it('should replace nested if block helper correctly', () => {
            // Given
            const tournament: UserTournamentModel = { playerAllocationsRemaining: 5 } as UserTournamentModel;

            const user: User = {} as User;
            const topContent = `{{#exists tournament.playerAllocationsRemaining}}{{#if tournament.playerAllocationsRemaining}}{{tournament.playerAllocationsRemaining}}{{else}}No allocations{{/if}}{{else}}Does not exist{{/exists}}`;
            const tournamentIntro: TournamentIntro = {
                id: 1,
                name: 'Test',
                topContent,
                bottomContent: '',
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const tournamentIntroModel: TournamentIntroModel = {
                topContent: '5',
                bottomContent: ''
            };

            const compiler = new TournamentIntroCompiler();

            // When
            const result = compiler.compile(tournamentIntro, { tournament, user });

            // Then
            expect(result).to.deep.equal(tournamentIntroModel);
        });
    });
});