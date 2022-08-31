import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { NumericTransformer } from '../../core/db/orm';
import { StoreItemType } from '../store-item-type';

@Entity()
export class StoreItemEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public price!: number;

    @Column()
    public quantity!: number;

    @Column()
    public minLevel!: number;

    @Column()
    public maxLevel!: number;

    @Column({ nullable: true })
    public tag?: string;

    @Column({ nullable: true })
    public priority?: number;

    @Column({ nullable: true })
    public imageUrl?: string;

    @Column({ type: 'enum', enum: StoreItemType, readonly: true })
    public type!: StoreItemType;

    @Column({ default: true })
    public public!: boolean;

    @Column({ default: true })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}