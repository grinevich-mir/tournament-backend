import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class SkinEntity {
    @PrimaryColumn({ length: 10 })
    public id!: string;

    @Column({ nullable: false })
    public name!: string;

    @Column({ nullable: false })
    public userPoolId!: string;

    @Column({ nullable: false })
    public domain!: string;

    @Column({ default: true })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}