import { Entity, TableInheritance, ManyToOne, JoinColumn, Column, ChildEntity } from 'typeorm';
import { TournamentPrizeBaseEntity } from './tournament-prize-base.entity';
import { TournamentTemplateEntity } from './tournament-template.entity';
import { CurrencyEntity } from '../../banking/entities/currency.entity';
import { NumericTransformer } from '../../core/db/orm';
import { PrizeType } from '../../prize';

@Entity()
@TableInheritance({ column: { type: 'enum', name: 'type', enum: PrizeType } })
export abstract class TournamentTemplatePrizeEntity extends TournamentPrizeBaseEntity {
    @Column()
    public templateId!: number;

    @ManyToOne(() => TournamentTemplateEntity, { onDelete: 'CASCADE' })
    @JoinColumn()
    public template!: TournamentTemplateEntity;
}

@ChildEntity(PrizeType.Cash)
export class TournamentTemplateCashPrizeEntity extends TournamentTemplatePrizeEntity {
    @Column({ length: 3 })
    public currencyCode!: string;

    @ManyToOne(() => CurrencyEntity)
    @JoinColumn()
    public currency!: CurrencyEntity;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public amount!: number;
}

@ChildEntity(PrizeType.Upgrade)
export class TournamentTemplateUpgradePrizeEntity extends TournamentTemplatePrizeEntity {
    @Column()
    public level!: number;

    @Column()
    public duration!: number;
}

@ChildEntity(PrizeType.Tangible)
export class TournamentTemplateTangiblePrizeEntity extends TournamentTemplatePrizeEntity {
    @Column()
    public name!: string;

    @Column({ length: 10 })
    public shortName!: string;

    @Column()
    public imageUrl!: string;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public cashAlternativeAmount!: number;
}