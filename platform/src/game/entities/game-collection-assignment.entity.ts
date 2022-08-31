import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { GameCollectionEntity } from './game-collection.entity';
import { GameEntity } from './game.entity';

@Entity()
export class GameCollectionAssignmentEntity {
    @PrimaryColumn()
    public collectionId!: number;

    @ManyToOne(() => GameCollectionEntity, m => m.assignments)
    @JoinColumn()
    public collection!: GameCollectionEntity;

    @PrimaryColumn()
    public position!: number;

    @Column()
    public gameId!: number;

    @ManyToOne(() => GameEntity)
    @JoinColumn()
    public game!: GameEntity;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}