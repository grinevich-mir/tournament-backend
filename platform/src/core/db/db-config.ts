export interface DbConfig {
    name: string;
    host: string;
    port: number;
    username: string;
    password: string;
    slaveHosts?: string[];
    entities: any[];
}