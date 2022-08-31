import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class ReferralGroupEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ length: 50 })
    public name!: string;

    @Column({ default: false })
    public default!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}