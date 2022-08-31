import { UpgradeRepository } from './repositories';
import { UserManager } from '../user';

export abstract class UpgradeManagerBase {
    constructor(
        protected readonly upgradeRepository: UpgradeRepository,
        protected readonly userManager: UserManager) {

    }

    public async updateUserLevel(userId: number): Promise<number> {
        const level = await this.upgradeRepository.getMaxActiveLevel(userId);
        await this.userManager.setLevel(userId, level);
        return level;
    }
}