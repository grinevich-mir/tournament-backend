import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { GameTypeEntity } from './game-type.entity';
import { GameProviderEntity } from './game-provider.entity';
import { GameMetadata } from '../game-metadata';
import { NumericTransformer } from '../../core/db/orm';
import { GameOrientation } from '../game-orientation';

@Entity()
@Unique(['providerId', 'providerRef'])
export class GameEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public typeId!: number;

    @ManyToOne(() => GameTypeEntity)
    @JoinColumn()
    public type!: GameTypeEntity;

    @Column()
    public providerId!: number;

    @ManyToOne(() => GameProviderEntity)
    @JoinColumn()
    public provider!: GameProviderEntity;

    @Column({ nullable: true })
    public providerRef?: string;

    @Column()
    public thumbnail!: string;

    @Column({ type: 'enum', enum: GameOrientation, default: GameOrientation.Portrait })
    public orientation!: GameOrientation;

    @Column({ type: 'simple-json', nullable: true })
    public metadata?: GameMetadata;

    @Column({ type: 'decimal', precision: 6, scale: 4, transformer: new NumericTransformer(true), nullable: true })
    public aspectRatioMobile?: number;

    @Column({ type: 'decimal', precision: 6, scale: 4, transformer: new NumericTransformer(true), nullable: true })
    public aspectRatioDesktop?: number;

    @Column({ default: true })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}