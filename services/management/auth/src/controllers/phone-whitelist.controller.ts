import { AdminController, Route, Tags, Security, Get, Post, Body, Delete, Put, Path } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { NotFoundError } from '@tcom/platform/lib/core';
import { PhoneWhitelistManager, PhoneWhitelistEntry } from '@tcom/platform/lib/auth';

@Tags('Phone Whitelist')
@Route('auth/phone/whitelist')
@LogClass()
export class PhoneWhitelistController extends AdminController {
    constructor(
        @Inject private readonly manager: PhoneWhitelistManager) {
        super();
    }

    /**
     * @summary Gets all whitelisted phone entries
     */
    @Get()
    @Security('admin', ['auth:phone:whitelist:read'])
    public async getAll(): Promise<PhoneWhitelistEntry[]> {
        return this.manager.getAll();
    }

    /**
     * @summary Gets whitelisted phone entry
     */
    @Get('{phoneNumber}')
    @Security('admin', ['auth:phone:whitelist:read'])
    public async get(@Path() phoneNumber: string): Promise<PhoneWhitelistEntry> {
        const entry = await this.manager.get(phoneNumber);

        if (!entry)
            throw new NotFoundError('Phone whitelist entry not found.');

        return entry;
    }

    /**
     * @summary Adds whitelisted phone entry
     */
    @Post()
    @Security('admin', ['auth:phone:whitelist:write'])
    public async add(@Body() entry: PhoneWhitelistEntry): Promise<void> {
        await this.manager.add(entry);
    }

    /**
     * @summary Updates whitelisted phone entry
     */
    @Put('{phoneNumber}')
    @Security('admin', ['auth:phone:whitelist:write'])
    public async update(@Path() phoneNumber: string, @Body() entry: PhoneWhitelistEntry): Promise<PhoneWhitelistEntry> {
        return this.manager.update(phoneNumber, entry);
    }

    /**
     * @summary Removes whitelisted phone entry
     */
    @Delete('{phoneNumber}')
    @Security('admin', ['auth:phone:whitelist:delete'])
    public async remove(@Path() phoneNumber: string): Promise<void> {
        await this.manager.remove(phoneNumber);
    }
}
