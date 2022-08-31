import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class CurrencyEntity {
    @PrimaryColumn({ length: 3 })
    public code!: string;

    @Column({ default: true })
    public userSelectable!: boolean;

    @Column({ default: true })
    public enabled!: boolean;
}
