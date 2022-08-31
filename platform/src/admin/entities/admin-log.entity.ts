import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, PrimaryColumn } from 'typeorm';

@Entity()
export class AdminLogEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Index()
    @Column()
    public userId!: string;

    @Column()
    public resource!: string;

    @Column()
    public action!: string;

    @Column({ type: 'simple-json' })
    public data!: { [name: string]: string | number | boolean | any[]; };

    @Column({ type: 'simple-json', nullable: true })
    public additionalData?: { [name: string]: string | number | boolean | any[]; };

    @PrimaryColumn()
    public timestamp!: Date;

    @CreateDateColumn()
    public createTime!: Date;
}