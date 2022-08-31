import { PrimaryGeneratedColumn, Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SkinEntity } from '../../skin/entities/skin.entity';

@Entity()
export class UserAvatarEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ length: 10 })
    public skinId!: string;

    @ManyToOne(() => SkinEntity)
    @JoinColumn()
    public skin!: SkinEntity;

    @Column()
    public url!: string;
}