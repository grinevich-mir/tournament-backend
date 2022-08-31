import { Column, CreateDateColumn, Entity, Generated, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from '../../user/entities';
import { GameProviderEntity } from './game-provider.entity';
import { GameEntity } from './game.entity';

@Entity()
export class GameBonusEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    @Generated()
    public id!: number;

    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Column()
    public gameId!: number;

    @ManyToOne(() => GameEntity)
    @JoinColumn()
    public game!: GameEntity;

    @Index()
    @Column({ nullable: true, length: 36 })
    public reference?: string;

    @Column()
    public providerId!: number;

    @ManyToOne(() => GameProviderEntity)
    @JoinColumn()
    public provider!: GameProviderEntity;

    @Column({ length: 50 })
    public providerRef!: string;

    @CreateDateColumn()
    public createTime!: Date;
}