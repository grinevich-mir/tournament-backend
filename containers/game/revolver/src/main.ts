import 'source-map-support/register';
import Logger, { LogContextResolver, LogClass, LogLevel, LogEntry } from '@tcom/platform/lib/core/logging';
import { Container, Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { StreamConsumer } from './stream-consumer';
import { EventProcessor } from './event-processor';
import { bootstrap } from '@tcom/platform/lib/core';
import { defaultConsoleFormat, ConsoleTransport } from '@tcom/platform/lib/core/logging/transports';
import { retry } from '@tcom/platform/lib/core/utilities';

bootstrap();

Logger.removeTransport(ConsoleTransport);
Logger.addTransport(new ConsoleTransport({
    level: LogLevel.Info,
    format: (entry: LogEntry, buffer?: string[]) => {
        const args = defaultConsoleFormat(entry, buffer);
        args.unshift(entry.date.toISOString(), entry.level.toUpperCase());
        return args;
    }
}));

Container.bind(LogContextResolver).provider({
    get: () => new LogContextResolver(() => ({
        application: `game-revolver-events`
    }))
});

@Singleton
@LogClass()
class Runner {
    constructor(
        @Inject private readonly consumer: StreamConsumer,
        @Inject private readonly processor: EventProcessor) {
        }

    public async start(): Promise<void> {
        process.on('uncaughtException', async error => {
            Logger.error(error);
            await this.shutdown();
        });

        process.on('unhandledRejection', async reason => {
            if (reason instanceof Error)
                Logger.error(reason);
            else
                Logger.error(`Unhandled Rejection: ${reason}`);

            await this.shutdown();
        });

        process.on('SIGTERM', async () => {
            Logger.info('SIGTERM was received, aborting...');
            await this.shutdown();
        });

        this.consumer.on('data', async (event) => {
            try {
                await retry(async () => this.processor.process(event), 20);
            } catch (err) {
                Logger.error(err);
            }
        });

        Logger.info('Connecting to event stream...');
        await this.consumer.connect();
    }

    private async shutdown(): Promise<void> {
        Logger.info('Shutting down...');
        Logger.info('Disconnecting from event stream...');
        await this.consumer.disconnect();
        await Logger.wait();
        Logger.info('Exiting...');
        process.exit(1);
    }
}

IocContainer.get(Runner).start().catch(err => { throw err; });