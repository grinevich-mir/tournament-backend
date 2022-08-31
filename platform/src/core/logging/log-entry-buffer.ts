import { LogEntry } from './log-entry';
import { LoggerJsonSerialiser } from './utilities';

export class LogEntryBuffer {
    private readonly entries: string[] = [];

    constructor(public readonly maxSize: number) {
    }

    public get size(): number {
        return this.entries.length;
    }

    public add(entry: LogEntry): void {
        const formatted = this.format(entry);
        this.entries.push(formatted);

        if (this.entries.length <= this.maxSize)
            return;

        this.entries.shift();
    }

    public get(): string[] {
        return this.entries;
    }

    public clear(): void {
        this.entries.length = 0;
    }

    private format(entry: LogEntry): string {
        let format = [entry.date.toISOString(), entry.level.toUpperCase(), entry.message].join(' ');

        if (entry.data)
            format += '\rData: ' + LoggerJsonSerialiser.serialise(entry.data);

        return format;
    }
}