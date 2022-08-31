import { Entity } from 'typeorm';
import { StatisticsBaseEntity } from './statistics-base.entity';

@Entity()
export class StatisticsHourlyEntity extends StatisticsBaseEntity {
}
