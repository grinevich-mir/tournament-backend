import { NotFoundError } from '@tcom/platform/lib/core';
import { AdminController, Route, Tags, Get, Security, Path, Post, Body, Put, Delete } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { NewPaymentOption, PaymentOption, PaymentOptionManager, PaymentOptionUpdate } from '@tcom/platform/lib/payment';

@Tags('Payment Option')
@Route('payment/option')
@LogClass()
export class PaymentOptionController extends AdminController {
    constructor(
        @Inject private readonly manager: PaymentOptionManager) {
        super();
    }

    /**
     * @summary Get all payment options
     */
    @Get()
    @Security('admin', ['payment:option:read'])
    public async getAll(): Promise<PaymentOption[]> {
        return this.manager.getAll();
    }

    /**
     * @summary Get payment option by ID
     */
    @Get('{id}')
    @Security('admin', ['payment:option:read'])
    public async get(@Path() id: number): Promise<PaymentOption> {
        const option = await this.manager.get(id);

        if (!option)
            throw new NotFoundError('Payment option not found.');

        return option;
    }

    /**
     * @summary Add new payment option
     */
    @Post()
    @Security('admin', ['payment:option:write'])
    public async add(@Body() option: NewPaymentOption): Promise<void> {
        await this.manager.add(option);
    }

    /**
     * @summary Update payment option
     */
    @Put('{id}')
    @Security('admin', ['payment:option:write'])
    public async update(@Path() id: number, @Body() update: PaymentOptionUpdate): Promise<PaymentOption> {
        return this.manager.update(id, update);
    }

    /**
     * @summary Remove payment option
     */
    @Delete('{id}')
    @Security('admin', ['payment:option:delete'])
    public async remove(@Path() id: number): Promise<void> {
        await this.manager.remove(id);
    }
}
