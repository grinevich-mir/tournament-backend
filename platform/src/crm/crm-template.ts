import { CRMTemplateName } from './crm-template-name';

export interface CRMTemplate {
    name: CRMTemplateName;
}

export interface CRMEmailTemplate extends CRMTemplate {
    subject?: string;
    html?: string;
    text?: string;
}

export interface CRMSmsTemplate extends CRMTemplate {
    body?: string;
}