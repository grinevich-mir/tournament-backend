import { Entity, TableInheritance, ManyToOne, JoinColumn, Column, ChildEntity } from 'typeorm';
import { CurrencyEntity } from '../../banking/entities/currency.entity';
import { NumericTransformer } from '../../core/db/orm';
import { PrizeType } from '../../prize';
import { LeaderboardPrizeBaseEntity } from './leaderboard-prize-base.entity';
import { LeaderboardScheduleEntity } from './leaderboard-schedule.entity';

@Entity()
@TableInheritance({ column: { type: 'enum', name: 'type', enum: PrizeType } })
export abstract class LeaderboardSchedulePrizeEntity extends LeaderboardPrizeBaseEntity {
    @Column({ length: 50 })
    public scheduleName!: string;

    @ManyToOne(() => LeaderboardScheduleEntity, { onDelete: 'CASCADE' })
    @JoinColumn()
    public schedule!: LeaderboardScheduleEntity;
}

@ChildEntity(PrizeType.Cash)
export class LeaderboardScheduleCashPrizeEntity extends LeaderboardSchedulePrizeEntity {
    @Column({ length: 3 })
    public currencyCode!: string;

    @ManyToOne(() => CurrencyEntity)
    @JoinColumn()
    public currency!: CurrencyEntity;

    @Column({ type: 'decimal', precision: 10, scale: 4, transformer: new NumericTransformer() })
    public amount!: number;
}

@ChildEntity(PrizeType.Upgrade)
export class LeaderboardScheduleUpgradePrizeEntity extends LeaderboardSchedulePrizeEntity {
    @Column()
    public level!: number;

    @Column()
    public duration!: number;
}

@ChildEntity(PrizeType.Tangible)
export class LeaderboardScheduleTangiblePrizeEntity extends LeaderboardSchedulePrizeEntity {
    @Column()
    public name!: string;

    @Column({ length: 10 })
    public shortName!: string;

    @Column()
    public imageUrl!: string;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public cashAlternativeAmount!: number;
}