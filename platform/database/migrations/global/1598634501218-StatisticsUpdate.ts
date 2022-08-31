import {MigrationInterface, QueryRunner} from "typeorm";

export class StatisticsUpdate1598634501218 implements MigrationInterface {
    name = 'StatisticsUpdate1598634501218'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE IF EXISTS `statistics_daily`", undefined);
        await queryRunner.query("DROP TABLE IF EXISTS `statistics_hourly`", undefined);
        await queryRunner.query("CREATE TABLE `statistics_daily` (`date` datetime NOT NULL, `usersNew` int NOT NULL, `subscriptionsNew` int NOT NULL, `subscriptionsRenewed` int NOT NULL, `revenue` decimal(16,4) NOT NULL, `prizePayoutBase` decimal(16,4) NOT NULL, `userAvgSubscribeTime` int NOT NULL, `tournamentUsers` int NOT NULL, `tournamentEntries` int NOT NULL, `userAvgTournamentPreVip` int NOT NULL, `tournamentAvgPlayedFree` int NOT NULL, `tournamentAvgPlayedVip` int NOT NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`date`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `statistics_hourly` (`date` datetime NOT NULL, `usersNew` int NOT NULL, `subscriptionsNew` int NOT NULL, `subscriptionsRenewed` int NOT NULL, `revenue` decimal(16,4) NOT NULL, `prizePayoutBase` decimal(16,4) NOT NULL, `userAvgSubscribeTime` int NOT NULL, `tournamentUsers` int NOT NULL, `tournamentEntries` int NOT NULL, `userAvgTournamentPreVip` int NOT NULL, `tournamentAvgPlayedFree` int NOT NULL, `tournamentAvgPlayedVip` int NOT NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`date`)) ENGINE=InnoDB", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE IF EXISTS `statistics_daily`", undefined);
        await queryRunner.query("DROP TABLE IF EXISTS `statistics_hourly`", undefined);
    }

}
