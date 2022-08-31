
export interface CustomErrorButton {
    label: string;
    action?: 'reality_reset' | 'refresh' | 'close' | 'history';
    link?: string;
}

export interface GameCustomMessage {
    title: string;
    text: string;
    fatal: boolean;
    type: 'realityCheck' | 'normal';
    buttons?: CustomErrorButton[];
}

export interface GameCustomMessageModel {
    msg: GameCustomMessage;
}