import { ChildEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../user/entities';
import { PaymentMethodCardType } from '../payment-method-card-type';
import { PaymentMethodMetadata } from '../payment-method-metadata';
import { PaymentMethodType } from '../payment-method-type';
import { PaymentProvider } from '../payment-provider';
import { PaymentEntity } from './payment.entity';

@Entity()
@TableInheritance({ column: { type: 'enum', name: 'type', enum: PaymentMethodType } })
export class PaymentMethodEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'enum', enum: PaymentMethodType })
    public type!: PaymentMethodType;

    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Column({ type: 'enum', enum: PaymentProvider })
    public provider!: PaymentProvider;

    @Column()
    public providerRef!: string;

    @OneToMany(() => PaymentEntity, p => p.paymentMethod)
    public payments!: PaymentEntity[];

    @Column({ type: 'simple-json', nullable: true })
    public metadata?: PaymentMethodMetadata;

    @Column({ default: false })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}

@ChildEntity(PaymentMethodType.CreditCard)
export class CreditCardPaymentMethodEntity extends PaymentMethodEntity {
    @Column({ type: 'enum', enum: PaymentMethodCardType })
    public cardType!: PaymentMethodCardType;

    @Column({ length: 4 })
    public lastFour!: string;

    @Column({ width: 2 })
    public expiryMonth!: number;

    @Column({ width: 4 })
    public expiryYear!: number;
}

@ChildEntity(PaymentMethodType.BankAccount)
export class BankAccountPaymentMethodEntity extends PaymentMethodEntity {
    @Column({ length: 50, nullable: true })
    public name?: string;

    @Column({ length: 50, nullable: true })
    public bankName?: string;

    @Column({ length: 50, nullable: true })
    public bankId?: string;

    @Column({ length: 16 })
    public routingNumber!: string;

    @Column({ length: 16 })
    public accountNumber!: string;
}

@ChildEntity(PaymentMethodType.PayPal)
export class PayPalPaymentMethodEntity extends PaymentMethodEntity {
    @Column()
    public email!: string;
}

@ChildEntity(PaymentMethodType.Skrill)
export class SkrillPaymentMethodEntity extends PaymentMethodEntity {
    @Column()
    public email!: string;
}

@ChildEntity(PaymentMethodType.Paymentwall)
export class PaymentwallPaymentMethodEntity extends PaymentMethodEntity {
}