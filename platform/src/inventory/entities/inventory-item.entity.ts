import { Entity, TableInheritance, ChildEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, JoinColumn, ManyToOne } from 'typeorm';
import { InventoryItemType } from '../inventory-type';
import { UserEntity } from '../../user/entities/user.entity';

@Entity()
@TableInheritance({ column: { type: 'enum', name: 'type', enum: InventoryItemType } })
export abstract class InventoryItemEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Column({ type: 'enum', enum: InventoryItemType, readonly: true })
    public type!: InventoryItemType;

    @Column({ nullable: true })
    public claimedTime?: Date;

    @Column({ nullable: true })
    public expires?: Date;

    @Column({ default: true})
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;
}

@ChildEntity(InventoryItemType.Upgrade)
export class UpgradeInventoryItemEntity extends InventoryItemEntity {
    @Column()
    public validDays!: number;

    @Column()
    public level!: number;
}

@ChildEntity(InventoryItemType.Diamonds)
export class DiamondInventoryItemEntity extends InventoryItemEntity {
    @Column()
    public amount!: number;
}
