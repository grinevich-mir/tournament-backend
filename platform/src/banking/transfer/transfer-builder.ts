import _ from 'lodash';
import { TransactionPurpose } from '../transaction-purpose';
import { RequesterType } from '../requester-type';
import { WalletType } from '../wallet-type';
import { PlatformWallets } from '../platform-wallets';
import { UserWalletAccounts } from '../user-wallet-accounts';
import { TransferTarget } from './transfer-target';
import { TransactionDescriptor } from './transfer-descriptor';
import { TransferConfig } from './transfer-config';
import { TransferProcessor } from './transfer-processor';
import { WalletEntry } from '../wallet-entry';

export interface InitialTransferBuilder {
    purpose(purpose: TransactionPurpose): PurposefulTransferBuilder;
}

interface PurposefulTransferBuilder {
    requestedBy(type: RequesterType, id: string | number): RequestedTransferBuilder;
}

interface RequestedTransferBuilder {
    linkedTo(entryId: number): LinkedTransferBuilder;
    memo(memo: string): MemoRequestedTransferBuilder;
    externalRef(reference: string): ExternalReferencedTransferBuilder;
    fromPlatform(name: PlatformWallets, bypassFlow?: boolean): FromTransferBuilder;
    fromUser(userId: number, account: UserWalletAccounts): FromTransferBuilder;
    from(target: TransferTarget): FromTransferBuilder;
}

interface ExternalReferencedTransferBuilder {
    linkedTo(entryId: number): LinkedTransferBuilder;
    memo(memo: string): MemoRequestedTransferBuilder;
    fromPlatform(name: PlatformWallets, bypassFlow?: boolean): FromTransferBuilder;
    fromUser(userId: number, account: UserWalletAccounts): FromTransferBuilder;
    from(target: TransferTarget): FromTransferBuilder;
}

interface LinkedTransferBuilder {
    memo(memo: string): MemoRequestedTransferBuilder;
    fromPlatform(name: PlatformWallets, bypassFlow?: boolean): FromTransferBuilder;
    fromUser(userId: number, account: UserWalletAccounts): FromTransferBuilder;
    from(target: TransferTarget): FromTransferBuilder;
}

interface MemoRequestedTransferBuilder {
    fromPlatform(name: PlatformWallets, bypassFlow?: boolean): FromTransferBuilder;
    fromUser(userId: number, account: UserWalletAccounts): FromTransferBuilder;
    from(target: TransferTarget): FromTransferBuilder;
}

interface FromTransferBuilder {
    toUser(userId: number, account: UserWalletAccounts): ToTransferBuilder;
    toPlatform(name: PlatformWallets, bypassFlow?: boolean): ToTransferBuilder;
    to(...target: TransferTarget[]): ToTransferBuilder;

}

export interface ToTransferBuilder extends FromTransferBuilder {
    commit(): Promise<WalletEntry>;
}

export class TransferBuilder implements InitialTransferBuilder, PurposefulTransferBuilder, RequestedTransferBuilder, ExternalReferencedTransferBuilder, LinkedTransferBuilder, MemoRequestedTransferBuilder, FromTransferBuilder, ToTransferBuilder {
    private config: Partial<TransferConfig> & Required<Pick<TransferConfig, 'descriptors'>> = {
        descriptors: []
    };

    private lastCreditDescriptor?: TransactionDescriptor;

    constructor(private processor: TransferProcessor, amount: number, currencyCode: string = 'USD') {
        if (amount <= 0)
            throw new Error('Amount must be more than zero.');

        this.config.amount = amount;
        this.config.currencyCode = currencyCode;
    }

    public purpose(purpose: TransactionPurpose): this {
        this.config.purpose = purpose;
        return this;
    }

    public requestedBy(type: RequesterType, id: string | number): this {
        this.config.requesterType = type;
        this.config.requesterId = id;
        return this;
    }

    public memo(memo: string): this {
        this.config.memo = memo;
        return this;
    }

    public externalRef(reference: string): this {
        this.config.externalRef = reference;
        return this;
    }

    public fromPlatform(name: PlatformWallets, bypassFlow?: boolean): this {
        this.config.descriptors.push({
            target: WalletType.Platform,
            wallet: name,
            type: 'Debit',
            bypassFlow
        });
        return this;
    }

    public fromUser(userId: number, account: UserWalletAccounts): this {
        this.config.descriptors.push({
            target: WalletType.User,
            userId,
            account,
            type: 'Debit'
        });
        return this;
    }

    public from(target: TransferTarget): this {
        if (target.type === WalletType.Platform)
            this.fromPlatform(target.name);
        if (target.type === WalletType.User)
            this.fromUser(target.userId, target.account);
        return this;
    }

    public toUser(userId: number, account: UserWalletAccounts): this {
        this.addDebitFromPreviousCredit();
        const descriptor: TransactionDescriptor = {
            target: WalletType.User,
            userId,
            account,
            type: 'Credit'
        };
        this.config.descriptors.push(descriptor);
        this.lastCreditDescriptor = descriptor;
        return this;
    }

    public toPlatform(name: PlatformWallets, bypassFlow?: boolean): this {
        this.addDebitFromPreviousCredit();
        const descriptor: TransactionDescriptor = {
            target: WalletType.Platform,
            wallet: name,
            type: 'Credit',
            bypassFlow
        };
        this.config.descriptors.push(descriptor);
        this.lastCreditDescriptor = descriptor;
        return this;
    }

    public to(...targets: TransferTarget[]): this {
        for (const target of targets) {
            if (target.type === WalletType.Platform)
                this.toPlatform(target.name);
            if (target.type === WalletType.User)
                this.toUser(target.userId, target.account);
        }
        return this;
    }

    public linkedTo(entryId: number): this {
        this.config.linkedEntryId = entryId;
        return this;
    }

    public async commit(): Promise<WalletEntry> {
        // TODO: Validate config
        return this.processor.process(this.config as Required<TransferConfig>);
    }

    private addDebitFromPreviousCredit(): void {
        if (!this.lastCreditDescriptor)
            return;

        if (this.lastCreditDescriptor.type === 'Debit')
            throw new Error('Previous descriptor was a debit not a credit.');

        const previousDebit = Object.assign({}, this.lastCreditDescriptor, { type: 'Debit' });
        this.config.descriptors.push(previousDebit);
    }
}