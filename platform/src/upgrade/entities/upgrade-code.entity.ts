import { Column, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn, Entity, JoinTable, ManyToMany } from 'typeorm';
import { InventoryItemEntity } from '../../inventory/entities';
import { UserEntity } from '../../user/entities/user.entity';

@Entity()
export class UpgradeCodeEntity {
    @PrimaryColumn({ length: 16 })
    public code!: string;

    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Column()
    public upgradeLevel!: number;

    @Column()
    public upgradeDuration!: number;

    @Column({ default: 0 })
    public diamonds!: number;

    @Column()
    public expireTime!: Date;

    @Column({ nullable: true })
    public processTime?: Date;

    @Column()
    public processExpireTime!: Date;

    @Column({ nullable: true, length: 36 })
    public processedBy?: string;

    @ManyToMany(() => InventoryItemEntity)
    @JoinTable()
    public inventoryItems!: InventoryItemEntity[];

    @CreateDateColumn()
    public createTime!: Date;
}