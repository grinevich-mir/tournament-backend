import { BadRequestError, ConflictError, NotFoundError, PagedResult } from '../core';
import { Inject, Singleton } from '../core/ioc';
import { UserManager } from '../user';
import { NewReferralUser, ReferralUser } from './referral-user';
import urlSlug from 'url-slug';
import { LogClass } from '../core/logging';
import { ReferralGroupManager } from './referral-group-manager';
import { ReferralUserRepository } from './repositories';
import { ReferralCodeGenerator, SlugValidator } from './utilities';
import { ReferralReward } from './referral-reward';
import { ReferralRewardFilter } from './referral-reward-filter';
import { ReferralUserSlugCheckResult } from './referral-user-slug-check-result';
import { ReferralUserCache } from './cache';

@Singleton
@LogClass()
export class ReferralUserManager {
    constructor(
        @Inject private readonly cache: ReferralUserCache,
        @Inject private readonly repository: ReferralUserRepository,
        @Inject private readonly groupManager: ReferralGroupManager,
        @Inject private readonly codeGenerator: ReferralCodeGenerator,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly slugValidator: SlugValidator) {
    }

    public async get(userId: number): Promise<ReferralUser | undefined> {
        const cachedUser = await this.cache.get(userId);

        if (cachedUser)
            return cachedUser;

        const user = await this.repository.get(userId);

        if (!user)
            return undefined;

        await this.cache.store(user);
        return user;
    }

    public async getByCode(code: string): Promise<ReferralUser | undefined> {
        const cachedUser = await this.cache.getByCode(code);

        if (cachedUser)
            return cachedUser;

        const user = await this.repository.getByCode(code);

        if (!user)
            return undefined;

        await this.cache.store(user);
        return user;
    }

    public async getBySlug(slug: string): Promise<ReferralUser | undefined> {
        const cachedUser = await this.cache.getBySlug(slug.toLowerCase());

        if (cachedUser)
            return cachedUser;

        const user = await this.repository.getBySlug(slug.toLowerCase());

        if (!user)
            return undefined;

        await this.cache.store(user);
        return user;
    }

    public async add(userId: number, active: boolean = false, slug?: string): Promise<ReferralUser> {
        const user = await this.userManager.get(userId);

        if (!user)
            throw new NotFoundError('User not found.');

        const defaultGroup = await this.groupManager.getDefault();
        const code = await this.generateCode();

        if (!slug)
            if (user.displayName)
                slug = await this.generateSlug(user.displayName);
            else
                slug = urlSlug(code);

        const newUser: NewReferralUser = {
            userId,
            active,
            code,
            slug: slug.toLowerCase(),
            groupId: defaultGroup.id
        };

        const created = await this.repository.add(newUser);
        await this.cache.store(created);
        return created;
    }

    public async setSlug(userId: number, slug: string): Promise<void> {
        if (!slug)
            throw new BadRequestError('Slug must not be empty.');

        slug = urlSlug(slug).toLowerCase();

        const refUser = await this.get(userId);

        if (!refUser)
            throw new NotFoundError('User not found.');

        const validation = await this.validateSlug(slug, userId);

        if (!validation.valid)
            throw new BadRequestError('Slug is invalid.');

        if (!validation.available)
            throw new ConflictError('Slug is not available.');

        await this.repository.setSlug(userId, slug);
        refUser.slug = slug;
        refUser.updateTime = new Date();
        await this.cache.store(refUser);
    }

    public async validateSlug(slug: string, requestingUserId: number): Promise<ReferralUserSlugCheckResult> {
        if (!slug)
            throw new BadRequestError('Slug was not supplied.');

        slug = urlSlug(slug).toLowerCase();

        const refUser = await this.get(requestingUserId);

        if (refUser && refUser.slug.toLowerCase() === slug.toLowerCase())
            return {
                valid: true,
                available: true
            };

        const validation = await this.slugValidator.validate(slug);
        let available = false;

        if (validation.valid)
            available = !await this.slugExists(slug);

        return {
            ...validation,
            available
        };
    }

    public async slugExists(slug: string): Promise<boolean> {
        return this.repository.slugExists(slug.toLowerCase());
    }

    public async activate(userId: number): Promise<void> {
        const user = await this.get(userId);

        if (!user || user.active)
            return;

        await this.repository.activate(userId);
        user.active = true;
        user.updateTime = new Date();
        await this.cache.store(user);
    }

    public async deactivate(userId: number): Promise<void> {
        const user = await this.get(userId);

        if (!user || !user.active)
            return;

        await this.repository.deactivate(userId);
        user.active = false;
        user.updateTime = new Date();
        await this.cache.store(user);
    }

    public async adjustRevenue(userId: number, amount: number): Promise<number> {
        const user = await this.get(userId);

        if (!user)
            throw new NotFoundError('Referral user not found.');

        const revenue = await this.repository.adjustRevenue(userId, amount);
        user.revenue = revenue;
        user.updateTime = new Date();
        await this.cache.store(user);
        return revenue;
    }

    public async adjustReferralCount(userId: number, amount: number): Promise<number> {
        const user = await this.get(userId);

        if (!user)
            throw new NotFoundError('Referral user not found.');

        const referralCount = await this.repository.adjustReferralCount(userId, amount);
        user.referralCount = referralCount;
        user.updateTime = new Date();
        await this.cache.store(user);
        return referralCount;
    }

    public async adjustRewardCount(userId: number, amount: number): Promise<number> {
        const user = await this.get(userId);

        if (!user)
            throw new NotFoundError('Referral user not found.');

        const rewardCount = await this.repository.adjustRewardCount(userId, amount);
        user.referralCount = rewardCount;
        user.updateTime = new Date();
        await this.cache.store(user);
        return rewardCount;
    }

    public async adjustDiamondCount(userId: number, amount: number): Promise<number> {
        const user = await this.get(userId);

        if (!user)
            throw new NotFoundError('Referral user not found.');

        const diamondCount = await this.repository.adjustDiamondCount(userId, amount);
        user.diamondCount = diamondCount;
        user.updateTime = new Date();
        await this.cache.store(user);
        return diamondCount;
    }

    public async getRewards(userId: number, filter?: ReferralRewardFilter): Promise<PagedResult<ReferralReward>> {
        return this.repository.getRewards(userId, filter);
    }

    public async setGroupId(id: number, groupId: number): Promise<void> {
        const user = await this.get(id);

        if (!user)
            throw new NotFoundError('Referral user not found.');

        await this.repository.setGroupId(id, groupId);

        user.groupId = groupId;
        user.updateTime = new Date();
        await this.cache.store(user);
    }

    private async generateCode(): Promise<string> {
        let code = this.codeGenerator.generate();

        while (await this.repository.codeExists(code))
            code = this.codeGenerator.generate();

        return code;
    }

    private async generateSlug(displayName: string): Promise<string> {
        let slug = urlSlug(displayName).toLowerCase();
        let count = 1;

        while (await this.repository.slugExists(slug)) {
            slug = urlSlug(displayName).toLowerCase() + count;
            count++;
        }

        return slug;
    }
}