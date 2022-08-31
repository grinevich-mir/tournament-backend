import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { Config, lambdaHandler, ParameterStore } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { GlobalDB } from '@tcom/platform/lib/core/db';
import { Parser } from 'json2csv';
import AWS from 'aws-sdk';

interface ImportEvent {
    test: boolean;
}

const sql = `
SELECT
    CONCAT(U.id, '_email') as Id,
    'EMAIL' AS ChannelType,
    UP.email AS Address,
    IF(UNS.enabled IS NULL, 'NONE', IF(UNS.enabled = 1, 'NONE', 'ALL')) AS OptOut,
    IF(UNS.enabled IS NULL, 'true', IF(UNS.enabled = 1, 'true', 'false')) AS 'Attributes.Enabled',
    IF(UNS.account IS NULL, 'false', IF(UNS.account = 0, 'true', 'false')) as 'Attributes.OptOut_Account',
    IF(UNS.prize IS NULL, 'false', IF(UNS.prize = 0, 'true', 'false')) as 'Attributes.OptOut_Prize',
    IF(UNS.marketing IS NULL, 'false', IF(UNS.marketing = 0, 'true', 'false')) as 'Attributes.OptOut_Marketing',
    U.id as 'User.UserId',
    U.id AS 'User.UserAttributes.UserId',
    DATE_FORMAT(U.createTime, '%Y-%m-%dT%TZ') AS 'User.UserAttributes.CreateTime',
    IF(UP.emailVerified = 1, 'true', 'false') as 'User.UserAttributes.EmailVerified',
    IFNULL(UP.forename, '') as 'User.UserAttributes.Forename',
    IFNULL(UP.surname, '') as 'User.UserAttributes.Surname',
    IFNULL(DATE_FORMAT(UP.dob, '%Y-%m-%dT%TZ'), '') as 'User.UserAttributes.Dob',
    IFNULL(U.displayName, '') as 'User.UserAttributes.DisplayName',
    IF(UP.mobileVerified = 1, 'true', 'false') as 'User.UserAttributes.SmsVerified',
    U.level AS 'User.UserAttributes.Level',
    U.skinId AS 'User.UserAttributes.SkinId',
    U.type AS 'User.UserAttributes.Type',
    IFNULL(U.regCountry, '') AS 'User.UserAttributes.RegCountry',
    IFNULL(U.regState, '') AS 'User.UserAttributes.RegState',
    IFNULL(U.country, '') AS 'User.UserAttributes.Country',
    IFNULL(U.currencyCode, '') AS 'User.UserAttributes.CurrencyCode',
    U.identityStatus as 'User.UserAttributes.IdentityStatus',
    U.addressStatus as 'User.UserAttributes.AddressStatus',
    IF(U.enabled = 1, 'true', 'false') AS 'User.UserAttributes.Enabled',
    IF(U.lastPlayed IS NULL, 'false', 'true') AS 'User.UserAttributes.HasPlayed',
    IFNULL(DATE_FORMAT(U.lastPlayed, '%Y-%m-%dT%TZ'), '') AS 'User.UserAttributes.LastPlayed',
    IF(S.createTime IS NULL, 'false', 'true') AS 'User.UserAttributes.HasSubscribed',
    IF(S.createTime IS NULL, 'false', IF(S.status = 'Active', 'true', 'false')) AS 'User.UserAttributes.HasActiveSubscription',
    IF(S.createTime IS NULL, 'false', IF(S.status = 'Cancelled', 'true', 'false')) AS 'User.UserAttributes.SubscriptionCancelling',
    IF(S.createTime IS NULL, 'false', IF(S.status = 'PastDue', 'true', 'false')) AS 'User.UserAttributes.SubscriptionPastDue',
    IFNULL(DATE_FORMAT(S.createTime, '%Y-%m-%dT%TZ'), '') AS 'User.UserAttributes.LastSubscribed',
    IF(TEP.createTime IS NULL, 'false', 'true') AS 'User.UserAttributes.HasTournamentWin',
    IFNULL(DATE_FORMAT(TEP.createTime, '%Y-%m-%dT%TZ'), '') AS 'User.UserAttributes.LastTournamentWin',
    IF(JPP.createTime IS NULL, 'false', 'true') AS 'User.UserAttributes.HasTournamentJackpotWin',
    IFNULL(DATE_FORMAT(JPP.createTime, '%Y-%m-%dT%TZ'), '') AS 'User.UserAttributes.LastTournamentJackpotWin',
    IF(TE.totalCost > 0, 'true', 'false') AS 'User.UserAttributes.HasPaidToPlayTournament',
    IF((O.status = 'Complete' AND O.priceTotal > 0), 'true', 'false') AS 'User.UserAttributes.HasPurchased',
    IFNULL(DATE_FORMAT(O.completeTime, '%Y-%m-%dT%TZ'), '') AS 'User.UserAttributes.LastPurchased',
    IF(OI.type = 'Diamonds', 'true', 'false') AS 'User.UserAttributes.HasPurchasedDiamonds',
    IFNULL(DATE_FORMAT(OI.processedTime, '%Y-%m-%dT%TZ'), '') AS 'User.UserAttributes.LastPurchasedDiamonds'
FROM
    user U
INNER JOIN
    user_profile UP ON UP.userId = U.id
LEFT JOIN
    user_notification_setting UNS ON UNS.userId = U.id AND UNS.channel = 'Email'
LEFT JOIN
    tournament_entry_prize TEP ON TEP.id = (SELECT tournament_entry_prize.id FROM tournament_entry_prize INNER JOIN tournament_entry ON tournament_entry.id = tournament_entry_prize.entryId WHERE U.id = tournament_entry.userId ORDER BY tournament_entry_prize.createTime DESC LIMIT 1)
LEFT JOIN
    subscription S ON S.id = (SELECT subscription.id FROM subscription WHERE subscription.userId = U.id ORDER BY createTime DESC LIMIT 1)
LEFT JOIN
    jackpot_payout JPP ON JPP.id = (SELECT jackpot_payout.id FROM jackpot_payout WHERE jackpot_payout.userId = U.id ORDER BY createTime DESC LIMIT 1)
LEFT JOIN
    tournament_entry TE ON TE.id = (SELECT tournament_entry.id FROM tournament_entry WHERE tournament_entry.userId = U.id ORDER BY tournament_entry.totalCost LIMIT 1)
LEFT JOIN
    \`order\` O ON O.id = (SELECT \`order\`.id FROM \`order\` WHERE \`order\`.userId = U.id ORDER BY \`order\`.completeTime LIMIT 1)
LEFT JOIN
    order_item OI ON OI.id = (SELECT order_item.id FROM order_item WHERE order_item.orderId = O.id ORDER BY order_item.processedTime LIMIT 1)
WHERE
    U.type != 'Bot';`;

@Singleton
@LogClass()
class ImportContactsHandler {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly parameterStore: ParameterStore) {
    }

    public async execute(event: ImportEvent): Promise<void> {
        const connection = await this.db.getConnection();

        const result = await connection.query(sql);
        const csv = new Parser({
            header: true
        }).parse(result);

        const s3 = new AWS.S3({
            region: Config.region
        });

        const bucket = `io.tgaming.${Config.stage}.tournament.pinpoint-import`;
        const fileName = `${new Date().toISOString()}.csv`;
        await s3.putObject({
            Bucket: bucket,
            Key: fileName,
            Body: csv,
            ContentType: 'text/csv'
        }).promise();

        Logger.info(`CSV created at: s3://${bucket}/${fileName}`);

        if (event.test)
            return;

        const appId = await this.parameterStore.get(`/${Config.stage}/pinpoint/app-id`);

        const pinpoint = new AWS.Pinpoint({region: Config.region});
        const importJob = await pinpoint.createImportJob({
            ApplicationId: appId,
            ImportJobRequest: {
                Format: 'CSV',
                RoleArn: `arn:aws:iam::${Config.accountId}:role/PinpointSegmentImport`,
                S3Url: `s3://${bucket}/${fileName}`,
                RegisterEndpoints: true
            }
        }).promise();

        console.log(importJob);
    }
}

export const importContacts = lambdaHandler((event: ImportEvent) => IocContainer.get(ImportContactsHandler).execute(event));
