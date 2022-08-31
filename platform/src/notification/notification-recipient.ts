export interface NotificationRecipient {
    notificationId: number;
    userId: number;
    readTime?: Date;
    createTime: Date;
    updateTime: Date;
}