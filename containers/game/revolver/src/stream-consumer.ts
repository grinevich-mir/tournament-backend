import { Singleton, Inject } from '@tcom/platform/lib/core/ioc';
import { ParameterStore, Config } from '@tcom/platform/lib/core';
import rhea, { Connection, ConnectionOptions, EventContext, Message } from 'rhea';
import Logger, { LogClass, LogMethod } from '@tcom/platform/lib/core/logging';
import { EventEmitter, DefaultEventMap } from 'tsee';
import { RevolverEvent } from './interfaces';
import { GlobalDB } from '@tcom/platform/lib/core/db';

export interface StreamConsumerEventMap extends DefaultEventMap {
    connected: (context: EventContext) => Promise<any> | void;
    disconnected: () => Promise<any> | void;
    data: (event: RevolverEvent, context: EventContext) =>  Promise<any> | void;
}

export const CREDIT_WINDOW = 50;

@Singleton
@LogClass()
export class StreamConsumer extends EventEmitter<StreamConsumerEventMap> {
    public connected = false;

    private connection?: Connection;
    private connectAttempt = 0;
    private idleReconnectTimeout!: NodeJS.Timeout;
    private idleTimeout = 600000;

    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly db: GlobalDB) {
            super();
        }

    public async connect(): Promise<void> {
        // Get a DB connection to populate the pool and ensure the async message process doesn't max out our db connections
        await this.db.getConnection();
        this.stopIdleTimeout();

        const hosts = await this.parameterStore.getList(`/${Config.stage}/integration/revolver/events/hosts`);
        const username = await this.parameterStore.get(`/${Config.stage}/integration/revolver/events/username`);
        const password = await this.parameterStore.get(`/${Config.stage}/integration/revolver/events/password`, true);

        return new Promise((resolve, reject) => {
            const connectionOptions: ConnectionOptions = {
                username,
                password,
                transport: 'ssl',
                connection_details: () => {
                    const host = hosts[this.connectAttempt % hosts.length];
                    Logger.info(`Connecting to ${host}...`);
                    this.connectAttempt++;
                    return {
                        host,
                        port: 5671,
                        transport: 'ssl'
                    };
                }
            };

            const nonFatalErrors = ['amqp:connection:forced', 'amqp:resource-limit-exceeded'];

            this.connection = rhea
                .create_container({ non_fatal_errors: nonFatalErrors })
                .connect(connectionOptions);

            this.connection.open_receiver({
                name: 'RGS.Campaigns',
                source: {
                    address: 'tournament.com',
                    durable: 2,
                    expiry_policy: 'never'
                },
                autoaccept: true,
                credit_window: CREDIT_WINDOW
            });

            this.connection.on('connection_open', (context: EventContext) => {
                Logger.info('Connected.');
                this.connected = true;
                this.emit('connected', context);
                this.startIdleTimeout();
                resolve();
            });

            this.connection.on('connection_closed', (context: EventContext) => {
                Logger.info('Connection closed.');
                this.connected = false;
                this.stopIdleTimeout();
                this.emit('connection_closed');
            });

            this.connection.on('disconnected', (context: EventContext) => {
                if (context.error)
                    Logger.error('Disconnected with error.', context.error);
                else
                    Logger.info('Disconnected.');

                this.connected = false;
                this.stopIdleTimeout();
                this.emit('disconnected');
            });

            this.connection.on('connection_error', (context: EventContext) => {
                this.connected = false;
                if (context.error)
                    Logger.error(context.error);

                this.stopIdleTimeout();
                reject(new Error(`Failed to connect: ${context.error?.message}`));
            });

            this.connection.on('message', async (context: EventContext) => {
                this.startIdleTimeout();
                if (!context.message) {
                    Logger.warn('No message provided.');
                    return;
                }

                if (!context.message.body) {
                    Logger.warn('Message has no body.');
                    return;
                }

                switch (context.message.body) {
                    case 'detach':
                    case 'close':
                        if (context.receiver)
                            context.receiver.detach();
                        context.connection.close();
                        break;

                    default:
                        try {
                            await this.handleMessage(context);
                        } catch (err) {
                            if (err instanceof Error)
                                Logger.error(err);
                            else
                                Logger.error(`Unhandled Rejection: ${err}`);
                        }
                        break;
                }
            });
        });
    }

    public disconnect(): void {
        this.stopIdleTimeout();
        if (this.connection)
            try {
                this.connection.close();
            } catch (err) {
                Logger.warn(err.message);
            }

        this.connection = undefined;
    }

    private async reconnect(): Promise<void> {
        this.disconnect();
        await this.connect();
    }

    @LogMethod({ arguments: false })
    private async handleMessage(context: EventContext): Promise<void> {
        if (!context.message) {
            Logger.warn('No message provided.', context);
            return;
        }

        const message: Message = context.message;

        try {
            const event: RevolverEvent = message.body;
            event.time = new Date(event.time);
            this.emit('data', event, context);
        } catch (err) {
            Logger.error('Failed to parse event stream message.', err);
        }
    }

    private startIdleTimeout(): void {
        clearTimeout(this.idleReconnectTimeout);
        this.idleReconnectTimeout = setTimeout(async () => {
            Logger.warn('No messages received before idle timeout, reconnecting...');
            await this.reconnect();
        }, this.idleTimeout);
    }

    private stopIdleTimeout(): void {
        clearTimeout(this.idleReconnectTimeout);
    }
}