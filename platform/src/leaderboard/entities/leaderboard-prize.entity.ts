import { Entity, TableInheritance, ManyToOne, JoinColumn, Column, ChildEntity } from 'typeorm';
import { CurrencyEntity } from '../../banking/entities/currency.entity';
import { NumericTransformer } from '../../core/db/orm';
import { PrizeType } from '../../prize';
import { LeaderboardEntity } from './leaderboard.entity';
import { LeaderboardPrizeBaseEntity } from './leaderboard-prize-base.entity';

@Entity()
@TableInheritance({ column: { type: 'enum', name: 'type', enum: PrizeType } })
export abstract class LeaderboardPrizeEntity extends LeaderboardPrizeBaseEntity {
    @Column({ type: 'int', unsigned: true, width: 10 })
    public leaderboardId!: number;

    @ManyToOne(() => LeaderboardEntity, { onDelete: 'CASCADE' })
    @JoinColumn()
    public leaderboard!: LeaderboardEntity;
}

@ChildEntity(PrizeType.Cash)
export class LeaderboardCashPrizeEntity extends LeaderboardPrizeEntity {
    @Column({ length: 3 })
    public currencyCode!: string;

    @ManyToOne(() => CurrencyEntity)
    @JoinColumn()
    public currency!: CurrencyEntity;

    @Column({ type: 'decimal', precision: 10, scale: 4, transformer: new NumericTransformer() })
    public amount!: number;
}

@ChildEntity(PrizeType.Upgrade)
export class LeaderboardUpgradePrizeEntity extends LeaderboardPrizeEntity {
    @Column()
    public level!: number;

    @Column()
    public duration!: number;
}

@ChildEntity(PrizeType.Tangible)
export class LeaderboardTangiblePrizeEntity extends LeaderboardPrizeEntity {
    @Column()
    public name!: string;

    @Column({ length: 10 })
    public shortName!: string;

    @Column()
    public imageUrl!: string;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public cashAlternativeAmount!: number;
}