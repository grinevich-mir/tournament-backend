declare module 'ioredis-commands' {
    const commands: {
        [command: string]: any;
    };
    export default commands;
}