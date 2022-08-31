import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { GameSessionManager } from '@tcom/platform/lib/game';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class ExpireGameSessionsHandler {
    constructor(
        @Inject private readonly sessionManager: GameSessionManager) {
    }

    public async execute(): Promise<void> {
        await this.sessionManager.setExpiredStatuses();
    }
}

export const expireGameSessions = lambdaHandler((event: SNSEvent) => IocContainer.get(ExpireGameSessionsHandler).execute());