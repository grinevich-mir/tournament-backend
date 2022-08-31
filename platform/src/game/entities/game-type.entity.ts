import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class GameTypeEntity {
    @PrimaryColumn()
    public id!: number;

    @Column({ unique: true })
    public name!: string;

    @Column({ default: true })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}