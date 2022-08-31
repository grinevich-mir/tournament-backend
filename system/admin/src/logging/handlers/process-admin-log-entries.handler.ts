import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler, JsonSerialiser } from '@tcom/platform/lib/core';
import { SQSEvent } from 'aws-lambda';
import { AdminLogEntity } from '@tcom/platform/lib/admin/entities';
import { AdminLogRepository } from '@tcom/platform/lib/admin/repositories';
import { AdminLogMessage } from '@tcom/platform/lib/admin';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class ProcessAdminLogMessagesHandler {
    constructor(
        @Inject private readonly adminLogRepository: AdminLogRepository,
        @Inject private readonly serialiser: JsonSerialiser) { }

    public async execute(event: SQSEvent): Promise<void> {
        for (const record of event.Records) {
            const item = this.serialiser.deserialise<AdminLogMessage>(record.body);
            const entity = this.createEntity(item);
            await this.adminLogRepository.add(entity);
        }
    }

    private createEntity(message: AdminLogMessage): AdminLogEntity {
        const entity = new AdminLogEntity();
        entity.userId = message.userId;
        entity.resource = message.resource;
        entity.action = message.action;
        entity.data = message.data;
        if (message.additionalData)
            entity.additionalData = message.additionalData;
        entity.timestamp = new Date(message.timestamp);
        return entity;
    }
}

export const processAdminLogMessagesHandler = lambdaHandler((event: SQSEvent) => IocContainer.get(ProcessAdminLogMessagesHandler).execute(event));