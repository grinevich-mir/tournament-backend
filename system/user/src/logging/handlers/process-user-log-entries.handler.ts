import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler, JsonSerialiser } from '@tcom/platform/lib/core';
import { SQSEvent } from 'aws-lambda';
import { UserLogRepository } from '@tcom/platform/lib/user/repositories';
import { UserLogEntity } from '@tcom/platform/lib/user/entities';
import Logger, { UserLogMessage, LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class ProcessUserLogMessagesHandler {
    constructor(
        @Inject private readonly userLogRepository: UserLogRepository,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async execute(event: SQSEvent): Promise<void> {
        const logs: UserLogMessage[] = [];

        for (const record of event.Records) {
            Logger.info(`Processing messages: ${record.body}`);
            const messages = this.serialiser.deserialise<UserLogMessage[]>(record.body);

            if (messages.length === 0)
                continue;

            logs.push(...messages);
        }

        const entities = logs.map(m => this.createEntity(m));
        await this.userLogRepository.add(...entities);
    }

    private createEntity(message: UserLogMessage): UserLogEntity {
        const entity = new UserLogEntity();
        entity.type = message.type;
        entity.userId = message.userId;
        entity.action = message.action;
        entity.originator = message.originator;
        if (message.originatorId)
            entity.originatorId = message.originatorId;
        entity.application = message.application;
        entity.data = message.data;
        entity.timestamp = new Date(message.timestamp);
        return entity;
    }
}

export const processUserLogMessages = lambdaHandler((event: SQSEvent) => IocContainer.get(ProcessUserLogMessagesHandler).execute(event));