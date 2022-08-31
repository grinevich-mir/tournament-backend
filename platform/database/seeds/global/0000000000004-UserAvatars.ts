import {MigrationInterface, QueryRunner, In} from "typeorm";
import { UserAvatarEntity } from '../../../src/user/entities/user-avatar.entity';
import _ from 'lodash';
import * as env from 'env-var';

const stage = env.get('STAGE').required().asString();
const config = env.get('BRAND_CONFIG').required().asJsonObject() as any;
const skins = Object.keys(config.skins);
const avatars: Partial<UserAvatarEntity>[] = [];

for (const skin of skins) {
    avatars.push({
        id: avatars.length + 1,
        skinId: skin,
        url: `https://content.tournament.${stage}.tgaming.io/avatars/t-avatar.png`
    });
}

export class UserAvatars0000000000004 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.manager.save(avatars.map((type: any) => {
            const entity = new UserAvatarEntity();
            Object.assign(entity, type);
            return entity;
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.connection.createQueryBuilder(queryRunner)
            .delete()
            .from(UserAvatarEntity)
            .where({ id: In(avatars.map(b => b.id)) })
            .execute();
    }

}
