import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PaymentOptionEntity } from './payment-option.entity';

@Entity()
export class PaymentOptionCountryEntity {
    @PrimaryColumn()
    public countryCode!: string;

    @PrimaryColumn()
    public paymentOptionId!: number;

    @ManyToOne(() => PaymentOptionEntity, r => r.countries)
    @JoinColumn()
    public paymentOption!: PaymentOptionEntity;
}