import { Generated, Index, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, Entity, PrimaryColumn } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { GameEntity } from './game.entity';
import { CurrencyEntity } from '../../banking/entities/currency.entity';
import { GameSessionStatus } from '../game-session-status';
import { GameSessionMetadata } from '../game-session-metadata';
import { GameProviderEntity } from './game-provider.entity';
import { Type } from 'class-transformer';

@Entity()
@Index(['expireTime', 'status'])
export class GameSessionEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    @Generated()
    public id!: number;

    @Index({ unique: true })
    @Generated('uuid')
    @Column({ length: 36 })
    public secureId!: string;

    @Index()
    @Column({ nullable: true, length: 36 })
    public reference?: string;

    @Column({ type: 'enum', enum: GameSessionStatus, default: GameSessionStatus.Created })
    public status!: GameSessionStatus;

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

    @Column()
    public providerId!: number;

    @ManyToOne(() => GameProviderEntity)
    @JoinColumn()
    public provider!: GameProviderEntity;

    @Column({ length: 3 })
    public currencyCode!: string;

    @ManyToOne(() => CurrencyEntity)
    @JoinColumn()
    public currency!: CurrencyEntity;

    @Column({ length: 2 })
    public language!: string;

    @Column({ type: 'simple-json', nullable: true })
    public metadata!: GameSessionMetadata;

    @Type(() => Date)
    @Column()
    public expireTime!: Date;

    @Type(() => Date)
    @CreateDateColumn()
    public createTime!: Date;

    @Type(() => Date)
    @UpdateDateColumn()
    public updateTime!: Date;
}