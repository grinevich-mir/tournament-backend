export enum SESNotificationType {
    Complaint = 'Complaint',
    Bounce = 'Bounce'
}

export interface SESNotificationBase {
    notificationType: SESNotificationType;
    mail: any;
}

export interface SESNotificationRecipient {
    emailAddress: string;
}

export interface SESBounceNotificationRecipient extends SESNotificationRecipient {
    status: string;
    action: string;
    diagnosticCode: string;
}

export interface SESBounceNotification extends SESNotificationBase {
    notificationType: SESNotificationType.Bounce;
    bounce: {
        bounceType: 'Undetermined' | 'Permanent' | 'Transient';
        bounceSubType: 'Undetermined' | 'General' | 'NoEmail' | 'Suppressed' | 'OnAccountSuppressionList' | 'MailboxFull' | 'MessageTooLarge' | 'ContentRejected' | 'AttachmentRejected';
        bouncedRecipients: SESBounceNotificationRecipient[];
        timestamp: Date;
        feedbackId: string;
        remoteMtaIp: string;
        reportingMTA: string;
    };
}

export interface SESComplaintNotification extends SESNotificationBase {
    notificationType: SESNotificationType.Complaint;
    complaint: {
        complainedRecipients: SESNotificationRecipient[];
        timestamp: Date;
        feedbackId: string;
        userAgent: string;
        complaintFeedbackType: 'abuse' | 'auth-failure' | 'fraid' | 'not-spam' | 'other' | 'virus';
    };
}

export type SESNotification = SESBounceNotification | SESComplaintNotification;