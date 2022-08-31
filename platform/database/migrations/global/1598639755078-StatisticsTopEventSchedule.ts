import {MigrationInterface, QueryRunner} from "typeorm";

export class StatisticsTopEventSchedule1598639755078 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER EVENT statistics_top ON SCHEDULE EVERY 15 MINUTE STARTS DATE_FORMAT(CURRENT_TIMESTAMP, "%y-%m-%d %H:00:00")`);

    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("ALTER EVENT statistics_top ON SCHEDULE EVERY 1 DAY STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY)");
    }

}
