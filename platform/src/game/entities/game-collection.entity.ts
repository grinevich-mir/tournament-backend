import { ManyToOne, JoinColumn, Column, CreateDateColumn, UpdateDateColumn, Entity, PrimaryGeneratedColumn, Unique, OneToMany } from 'typeorm';
import { SkinEntity } from '../../skin/entities/skin.entity';
import { GameCollectionAssignmentEntity } from './game-collection-assignment.entity';

@Entity()
@Unique(['skinId', 'name'])
export class GameCollectionEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public skinId!: string;

    @ManyToOne(() => SkinEntity)
    @JoinColumn()
    public skin!: SkinEntity;

    @Column()
    public name!: string;

    @OneToMany(() => GameCollectionAssignmentEntity, m => m.collection)
    public assignments!: GameCollectionAssignmentEntity[];

    @Column({ default: true })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}