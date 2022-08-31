import { IocContainer } from '@tcom/platform/lib/core/ioc';
import { EngineManager } from './engine-manager';
import { bootstrap } from '@tcom/platform/lib/core';
import Logger, { LogLevel, LogEntry } from '@tcom/platform/lib/core/logging';
import { ConsoleTransport, defaultConsoleFormat } from '@tcom/platform/lib/core/logging/transports';

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

export class Ignition {
    public static async start(): Promise<void> {
        const manager = IocContainer.get(EngineManager);
        await manager.init();
    }
}