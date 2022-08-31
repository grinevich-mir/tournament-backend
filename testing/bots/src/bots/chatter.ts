import { ChatManager } from '@tcom/platform/lib/chat';
import { Bot } from './bot';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { Job, cancelJob, scheduleJob } from 'node-schedule';
import _ from 'lodash';
import moment from 'moment';

const MESSAGES = [
    '1TG!',
    '2TG!',
    '3TG!',
    'OMG I LOVE BINGO!',
    'Can you smell that? 🤮',
    'I\'m gonna win!',
    'BINGO!',
    'ROFL',
    'I need a 🍺.',
    'I need a ☕️',
    'Anyone watch Eastenders last night?',
    'I ate a shoe.',
    'This is great!',
    'What time is it?',
    'Where are my keys?',
    '🤔',
    '🤡🤡🤡',
    'I\'m crazy! 🤪',
    '🤣',
    'LOL',
    'Anyone watch bake off?',
    'w00t',
    'I\'m hot! 🥵',
    'I\'m cold! 🥶',
    'Has it started yet?',
    'I hate losing 😡',
    'I lost my phone 😱',
    'How do I play this? 🧐',
    'Well isn\'t this just lovely?! 🥰',
    '💩💩💩',
    '💀',
    '👍',
    '🚴‍♀️',
    'I WILL DESTROY YOU!',
    'Bacon ipsum dolor amet meatball turducken salami, short loin chuck bacon pork chop spare ribs t-bone capicola kielbasa ham sirloin chicken. Biltong shank beef ribs, picanha pancetta salami venison flank. Pork corned beef brisket pork belly. Spare ribs salami sausage meatloaf beef ribs shank. Sausage hamburger drumstick, shankle ball tip ham picanha.'
];

export class Chatter {
    public running = false;

    private channel?: string;
    private chatJob?: Job;
    private chatty = false;

    public bot!: Bot;

    constructor(
        @Inject private readonly chatManager: ChatManager) {
    }

    public start(channel: string): void {
        this.channel = channel;
        this.chatty = _.random(0, 100) < 50;

        if (this.running)
            this.stop();

        this.running = true;

        if (this.chatty) {
            this.bot.log(`Starting chatter for channel '${channel}'...`);
            this.scheduleChat();
        }
    }

    public stop(): void {
        this.running = false;
        this.chatty = false;

        if (this.chatJob)
            cancelJob(this.chatJob);

        this.chatJob = undefined;
    }

    private scheduleChat(): void {
        const nextChatDelay = _.random(30, 240);
        const nextMessageTime = moment().add(nextChatDelay, 'seconds').toDate();
        this.chatJob = scheduleJob(nextMessageTime, async () => this.chat());
    }

    private async chat(): Promise<void> {
        if (!this.running || !this.channel)
            return;

        try {
            const message = _.sample(MESSAGES) as string;
            await this.chatManager.sendMessage(this.channel, this.bot.user.id, message);
            this.scheduleChat();
        } catch (err) {
            if (err.response.data.code === 500910) {
                this.bot.log('Stopping chat due to rate limit.');
                this.stop();
                return;
            }
            if (err.response.data.code === 400201) {
                this.bot.log('Stopping chat because channel doesn\'t exist.');
                this.stop();
                return;
            }
        }
    }
}