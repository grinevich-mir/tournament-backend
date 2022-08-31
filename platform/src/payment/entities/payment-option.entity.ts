import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PaymentMethodType } from '../payment-method-type';
import { CurrencyEntity } from '../../banking/entities';
import { PaymentOptionCountryEntity } from './payment-option-country.entity';
import { PaymentProvider } from '../payment-provider';

@Entity()
export class PaymentOptionEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column({ type: 'enum', enum: PaymentProvider })
    public provider!: PaymentProvider;

    @ManyToMany(() => CurrencyEntity)
    @JoinTable()
    public currencies!: CurrencyEntity[];

    @OneToMany(() => PaymentOptionCountryEntity, r => r.paymentOption, { cascade: ['insert'] })
    public countries!: PaymentOptionCountryEntity[];

    @Column({ type: 'simple-array' })
    public methodTypes!: PaymentMethodType[];

    @Column()
    public enabled!: boolean;

    @Column()
    public public!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}