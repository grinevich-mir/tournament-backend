import { MigrationInterface, QueryRunner, In } from "typeorm";
import { SubscriptionPromoEntity } from '../../../../src/subscription/entities/subscription-promo.entity';

const promos: Partial<SubscriptionPromoEntity>[] = [ 
    {
        id: 1,
        skinId: 'tournament',
        cycles: 1,
        expireIn: 12,
        onCancellation: true,
        enabled: false
    }
]

export class SubscriptionPromos0000000000008 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.manager.save(promos.map(promo => {
            const entity = new SubscriptionPromoEntity();
            Object.assign(entity, promo);
            return entity;
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.connection.createQueryBuilder(queryRunner)
            .delete()
            .from(SubscriptionPromoEntity)
            .where({ id: In(promos.map(b => b.id)) })
            .execute();
    }

}
