import {MigrationInterface, QueryRunner} from "typeorm";
import { SubscriptionTierEntity, SubscriptionTierPriceEntity, SubscriptionTierVariantEntity } from '../../../../src/subscription/entities';
import { SubscriptionPeriod } from '../../../../src/subscription/subscription-period';

export const tiers = [
    {
        id: 1,
        skinId: 'tournament',
        code: 'member',
        level: 1,
        name: 'Member',
        enabled: true,
        variants: [
            {
                id: 1,
                name: 'Default',
                code: 'default',
                tierId: 1,
                period: SubscriptionPeriod.Month,
                default: true,
                enabled: true,
                prices: [
                    {
                        currencyCode: 'USD',
                        amount: 29.99,
                        enabled: true
                    }
                ]
            },
            {
                id: 2,
                name: 'Founder',
                code: 'founder',
                period: SubscriptionPeriod.Month,
                frequency: 12,
                enabled: true,
                prices: [
                    {
                        currencyCode: 'USD',
                        amount: 199.99,
                        enabled: true
                    }
                ]
            }
        ]
    }
]

export class Subscriptions0000000000007 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        for (const tier of tiers) {
            const entity = new SubscriptionTierEntity();
            Object.assign(entity, tier);
            await queryRunner.manager.insert(SubscriptionTierEntity, entity);

            for (const variant of tier.variants) {
                const entity = new SubscriptionTierVariantEntity();
                entity.tierId = tier.id;
                Object.assign(entity, variant);
                await queryRunner.manager.insert(SubscriptionTierVariantEntity, entity);

                await queryRunner.manager.insert(SubscriptionTierPriceEntity, variant.prices.map(p => {
                    const entity = new SubscriptionTierPriceEntity();
                    entity.variantId = variant.id;
                    Object.assign(entity, p);
                    return entity;
                }));
            }
        }
    }

    public async down(_queryRunner: QueryRunner): Promise<any> {
    }

}
