import { MigrationInterface, QueryRunner, In } from 'typeorm';
import { TournamentTypeEntity } from '../../../src/tournament/entities';
import { TournamentType } from '../../../src/tournament/tournament-type';

const tournamentTypes: Partial<TournamentTypeEntity>[] = [
    {
        id: TournamentType.HiLo,
        name: 'HiLo',
        taskDefinition: 'tournament_engine_hilo'
    },
    {
        id: TournamentType.Bingo,
        name: 'Bingo',
        taskDefinition: 'tournament_engine_bingo'
    },
    {
        id: TournamentType.Slot,
        name: 'Slot',
        taskDefinition: 'tournament_engine_slot'
    },
    {
        id: TournamentType.Blackjack,
        name: 'Blackjack',
        taskDefinition: 'tournament_engine_blackjack'
    },
    {
        id: TournamentType.Crash,
        name: 'Crash',
        taskDefinition: 'tournament_engine_crash'
    }
];

export class Tournaments0000000000005 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.manager.save(tournamentTypes.map((type: any) => {
            const entity = new TournamentTypeEntity();
            Object.assign(entity, type);
            return entity;
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.connection.createQueryBuilder(queryRunner)
            .delete()
            .from(TournamentTypeEntity)
            .where({ id: In(tournamentTypes.map(b => b.id)) })
            .execute();
    }
}
