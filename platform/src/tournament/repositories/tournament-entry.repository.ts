import _ from 'lodash';
import { GlobalDB } from '../../core/db';
import { Inject, Singleton } from '../../core/ioc';
import { TournamentEntryEntity, TournamentEntryAllocationEntity, TournamentEntryPrizeEntity } from '../entities';
import { generateId } from '../../core';
import { FindOneOptions, FindManyOptions, In, MoreThan, IsNull } from 'typeorm';
import { TournamentEntryAllocationUpdate } from '../tournament-entry-allocation-update';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class TournamentEntryRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getAll(tournamentId: number): Promise<TournamentEntryEntity[]> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<TournamentEntryEntity> = {
            relations: ['allocations'],
            where: {
                tournamentId
            }
        };

        return connection.manager.find(TournamentEntryEntity, options);
    }

    public async getMultiple(tournamentId: number, userIds: number[]): Promise<TournamentEntryEntity[]> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<TournamentEntryEntity> = {
            relations: ['allocations'],
            where: {
                tournamentId,
                userId: In(userIds)
            }
        };

        return connection.manager.find(TournamentEntryEntity, options);
    }

    public async getRefundable(tournamentId: number, count: number): Promise<TournamentEntryEntity[]> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<TournamentEntryEntity> = {
            where: {
                tournamentId,
                totalCost: MoreThan(0),
                refundTime: IsNull()
            },
            take: count
        };

        return connection.manager.find(TournamentEntryEntity, options);
    }

    public async get(tournamentId: number, userId: number): Promise<TournamentEntryEntity | undefined> {
        const connection = await this.db.getConnection();
        const options: FindOneOptions<TournamentEntryEntity> = {
            relations: ['allocations'],
            where: {
                userId,
                tournamentId
            }
        };

        return connection.manager.findOne(TournamentEntryEntity, options);
    }

    public async getById(id: number): Promise<TournamentEntryEntity | undefined> {
        const connection = await this.db.getConnection();
        const options: FindOneOptions<TournamentEntryEntity> = {
            relations: ['allocations'],
            where: {
                id
            }
        };

        return connection.manager.findOne(TournamentEntryEntity, options);
    }

    public async getByToken(token: string): Promise<TournamentEntryEntity | undefined> {
        const connection = await this.db.getConnection();
        const options: FindOneOptions<TournamentEntryEntity> = {
            relations: ['allocations'],
            where: {
                token
            }
        };

        return connection.manager.findOne(TournamentEntryEntity, options);
    }

    public async getWinners(tournamentId: number): Promise<TournamentEntryEntity[]> {
        const connection = await this.db.getConnection();
        return connection.manager.find(TournamentEntryEntity, {
            join: {
                alias: 'entry',
                innerJoinAndSelect: {
                    prizes: 'entry.prizes'
                }
            },
            where: {
                tournamentId
            }
        });
    }

    public async add(tournamentId: number, userId: number, rounds?: number, credit?: number, cost: number = 0): Promise<TournamentEntryEntity> {
        const connection = await this.db.getConnection();
        const entry = new TournamentEntryEntity();
        entry.tournamentId = tournamentId;
        entry.userId = userId;
        entry.token = generateId();
        entry.totalCost = cost;

        await connection.manager.transaction(async manager => {
            await manager.insert(TournamentEntryEntity, entry);
            const allocation = this.createAllocation(entry.id, rounds, credit, cost);
            await manager.insert(TournamentEntryAllocationEntity, allocation);
        });

        return await this.getByToken(entry.token) as TournamentEntryEntity;
    }

    public async remove(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.delete(TournamentEntryEntity, id);
    }

    public async incrementCost(id: number, amount: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.createQueryBuilder()
            .update(TournamentEntryEntity)
            .set({
                totalCost: () => `totalCost + ${amount}`
            })
            .where({ id })
            .execute();
    }

    public async exists(tournamentId: number, userId: number): Promise<boolean> {
        const connection = await this.db.getConnection();
        const options: FindOneOptions<TournamentEntryEntity> = {
            where: {
                userId,
                tournamentId
            }
        };

        const count = await connection.manager.count(TournamentEntryEntity, options);
        return count > 0;
    }

    public async setActivatedTime(id: number, time: Date): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(TournamentEntryEntity, id, {
            activatedTime: time
        });
    }

    public async setRefundTime(id: number, time: Date): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(TournamentEntryEntity, id, {
            refundTime: time
        });
    }

    public async setKnockedOut(tournamentId: number, userId: number, knockedOut: boolean): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(TournamentEntryEntity, {
            tournamentId,
            userId
        },
            {
                knockedOut
            });
    }

    public async getAllocation(id: number): Promise<TournamentEntryAllocationEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(TournamentEntryAllocationEntity, id);
    }

    public async addAllocation(entryId: number, rounds?: number, credit?: number, cost: number = 0): Promise<TournamentEntryAllocationEntity> {
        const connection = await this.db.getConnection();
        const allocation = this.createAllocation(entryId, rounds, credit, cost);
        await connection.manager.insert(TournamentEntryAllocationEntity, allocation);
        return allocation;
    }

    public async updateAllocation(allocationId: number, update: TournamentEntryAllocationUpdate): Promise<void> {
        const connection = await this.db.getConnection();
        if (Object.keys(update).length === 0)
            return;

        await connection.manager.update(TournamentEntryAllocationEntity, allocationId, update);
    }

    public async addPrize(prize: TournamentEntryPrizeEntity): Promise<TournamentEntryPrizeEntity> {
        const connection = await this.db.getConnection();
        return connection.manager.save(prize);
    }

    public async addPrizes(prizes: TournamentEntryPrizeEntity[]): Promise<TournamentEntryPrizeEntity[]> {
        const connection = await this.db.getConnection();
        return connection.manager.save(prizes);
    }

    private createAllocation(entryId: number, rounds?: number, credit?: number, cost: number = 0): TournamentEntryAllocationEntity {
        const allocation = new TournamentEntryAllocationEntity();
        allocation.entryId = entryId;
        allocation.rounds = rounds;
        allocation.credit = credit;
        allocation.cost = cost;
        return allocation;
    }
}
