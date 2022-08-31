import { Singleton, Inject } from '../core/ioc';
import { LogClass } from '../core/logging';
import { PhoneWhitelistCache } from './cache';
import { PhoneWhitelistEntry } from './phone-whitelist-entry';

@Singleton
@LogClass()
export class PhoneWhitelistManager {
    constructor(
        @Inject private readonly cache: PhoneWhitelistCache) {
    }

    public async get(phoneNumber: string): Promise<PhoneWhitelistEntry | undefined> {
        return this.cache.get(phoneNumber);
    }

    public async getAll(): Promise<PhoneWhitelistEntry[]> {
        const cachedItems = await this.cache.getAll();

        if (!cachedItems || cachedItems.length === 0)
            return [];

        return cachedItems;
    }

    public async exists(phoneNumber: string): Promise<boolean> {
        return this.cache.exists(phoneNumber);
    }

    public async add(entry: PhoneWhitelistEntry): Promise<void> {
        const entries = await this.getAll();

        if (entries?.some(a => a.phoneNumber === entry.phoneNumber))
            throw new Error(`Whitelist entry for phone number '${entry.phoneNumber}' already exists.`);

        await this.cache.store(entry);
    }

    public async update(phoneNumber: string, update: PhoneWhitelistEntry): Promise<PhoneWhitelistEntry> {
        const entry = await this.get(phoneNumber);

        if (!entry)
            throw new Error(`Whitelist entry for phone number '${phoneNumber}' does not exist.`);

        entry.phoneNumber = update.phoneNumber;
        entry.descriptor = update.descriptor;

        await this.cache.store(entry);

        if (phoneNumber !== update.phoneNumber)
            await this.cache.remove(phoneNumber);

        return entry;
    }

    public async remove(phoneNumber: string): Promise<void> {
        const entry = await this.get(phoneNumber);

        if (!entry)
            throw new Error(`Whitelist entry for phone number '${phoneNumber}' does not exist.`);

        await this.cache.remove(phoneNumber);
    }
}