import { Entity, ManyToOne, PrimaryColumn, Column, Unique } from 'typeorm';
import { GameEntity } from '../../game/entities/game.entity';
import { TournamentTemplateEntity } from './tournament-template.entity';
import { GameMetadata } from '../../game/game-metadata';

@Entity()
@Unique(['templateId', 'position'])
export class TournamentTemplateGameAssignmentEntity {
    @PrimaryColumn()
    public templateId!: number;

    @ManyToOne(() => TournamentTemplateEntity, t => t.gameAssignments, { onDelete: 'CASCADE' })
    public template!: TournamentTemplateEntity;

    @Column()
    public gameId!: number;

    @ManyToOne(() => GameEntity)
    public game!: GameEntity;

    @PrimaryColumn()
    public position!: number;

    @Column({ type: 'simple-json', nullable: true })
    public metadataOverride?: GameMetadata;
}