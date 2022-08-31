import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, ChildEntity, TableInheritance, Index } from 'typeorm';
import { NumericTransformer } from '../../core/db/orm';
import { TournamentEntryEntity } from './tournament-entry.entity';
import { CurrencyEntity } from '../../banking/entities/currency.entity';
import { PrizeType } from '../../prize';

@Entity()
@TableInheritance({ column: { type: 'enum', name: 'type', enum: PrizeType } })
export abstract class TournamentEntryPrizeEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'enum', enum: PrizeType })
    public type!: PrizeType;

    @Column()
    public entryId!: number;

    @ManyToOne(() => TournamentEntryEntity, e => e.prizes)
    @JoinColumn()
    public entry!: TournamentEntryEntity;

    @Index()
    @CreateDateColumn()
    public createTime!: Date;
}

@ChildEntity(PrizeType.Cash)
export class TournamentEntryCashPrizeEntity extends TournamentEntryPrizeEntity {
    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public amount!: number;

    @Column({ length: 3 })
    public currencyCode!: string;

    @ManyToOne(() => CurrencyEntity)
    @JoinColumn()
    public currency!: CurrencyEntity;
}

@ChildEntity(PrizeType.Upgrade)
export class TournamentEntryUpgradePrizeEntity extends TournamentEntryPrizeEntity {
    @Column()
    public level!: number;

    @Column()
    public duration!: number;
}

@ChildEntity(PrizeType.Tangible)
export class TournamentEntryTangiblePrizeEntity extends TournamentEntryPrizeEntity {
    @Column()
    public name!: string;

    @Column({ length: 10 })
    public shortName!: string;

    @Column()
    public imageUrl!: string;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public cashAlternativeAmount!: number;
}