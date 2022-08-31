import { Entity, TableInheritance, ManyToOne, JoinColumn, Column, ChildEntity } from 'typeorm';
import { TournamentPrizeBaseEntity } from './tournament-prize-base.entity';
import { CurrencyEntity } from '../../banking/entities/currency.entity';
import { NumericTransformer } from '../../core/db/orm';
import { TournamentEntity } from './tournament.entity';
import { PrizeType } from '../../prize';

@Entity()
@TableInheritance({ column: { type: 'enum', name: 'type', enum: PrizeType } })
export abstract class TournamentPrizeEntity extends TournamentPrizeBaseEntity {
    @Column()
    public tournamentId!: number;

    @ManyToOne(() => TournamentEntity, { onDelete: 'CASCADE' })
    @JoinColumn()
    public tournament!: TournamentEntity;
}

@ChildEntity(PrizeType.Cash)
export class TournamentCashPrizeEntity extends TournamentPrizeEntity {
    @Column({ length: 3 })
    public currencyCode!: string;

    @ManyToOne(() => CurrencyEntity)
    @JoinColumn()
    public currency!: CurrencyEntity;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public amount!: number;
}

@ChildEntity(PrizeType.Upgrade)
export class TournamentUpgradePrizeEntity extends TournamentPrizeEntity {
    @Column()
    public level!: number;

    @Column()
    public duration!: number;
}

@ChildEntity(PrizeType.Tangible)
export class TournamentTangiblePrizeEntity extends TournamentPrizeEntity {
    @Column()
    public name!: string;

    @Column({ length: 10 })
    public shortName!: string;

    @Column()
    public imageUrl!: string;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public cashAlternativeAmount!: number;
}