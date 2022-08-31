import { MigrationInterface, QueryRunner, In } from 'typeorm';
import { SkinEntity } from '../../../src/skin/entities';
import * as env from 'env-var';

const config = env.get('BRAND_CONFIG').required().asJsonObject() as any;

const skins: Partial<SkinEntity>[] = Object.keys(config.skins).map(skin => {
    const skinConfig = config.skins[skin];

    return {
        id: skin,
        name: skinConfig.name,
        userPoolId: skinConfig.cognito.userPoolId,
        domain: skinConfig.domain
    };
});

export class Skins0000000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.manager.save(skins.map(skin => {
            const entity = new SkinEntity();
            Object.assign(entity, skin);
            return entity;
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.connection.createQueryBuilder(queryRunner)
            .delete()
            .from(SkinEntity)
            .where({ id: In(skins.map(b => b.id)) })
            .execute();
    }
}