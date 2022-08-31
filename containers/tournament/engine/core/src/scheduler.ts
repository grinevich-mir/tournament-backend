import { Job, scheduleJob, RecurrenceRule, RecurrenceSpecDateRange, RecurrenceSpecObjLit, JobCallback } from 'node-schedule';
import { Singleton } from '@tcom/platform/lib/core/ioc';

@Singleton
export class Scheduler {
    private jobs: { [name: string]: Job } = {};

    public schedule(name: string, rule: RecurrenceRule | RecurrenceSpecDateRange | RecurrenceSpecObjLit | Date | string, callback: JobCallback): Job {
        this.cancel(name);

        const job = scheduleJob(name, rule, callback);
        this.jobs[name] = job;
        if (rule instanceof Date)
            job.once('run', () => delete this.jobs[name]);
        return job;
    }

    public cancel(name: string): void {
        const job = this.jobs[name];

        if (!job)
            return;

        job.cancel();
        delete this.jobs[name];
    }

    public cancelAll(): void {
        for (const name of Object.keys(this.jobs))
            this.cancel(name);
    }
}