import { describe, it } from '@tcom/test';
import { mock, when, instance, verify, deepEqual, mockUserRequest, reset, mockUser } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { NotificationController } from '../../src/controllers/notification.controller';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { User, UserType } from '@tcom/platform/lib/user';
import { Notification, NotificationFilter, NotificationManager, NotificationType } from '@tcom/platform/lib/notification';

describe('NotificationController', () => {
    const mockManager = mock(NotificationManager);

    function getController(): NotificationController {
        return new NotificationController(
            instance(mockManager));
    }

    beforeEach(() => {
        reset(mockManager);
    });

    describe('getAll()', () => {
        it('should return notifications', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const read = false;
            const type = NotificationType.TournamentWin;
            const page = 1;
            const pageSize = 20;

            const filter: NotificationFilter = {
                read,
                type,
                page,
                pageSize
            };
            const notifications: Notification[] = [];


            when(mockManager.getAllForUser(userId, deepEqual(filter))).thenResolve(new PagedResult(notifications, 1, page, pageSize));

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getAll(read, type);

            // Then
            expect(result.items).to.equal(notifications);
            verify(mockManager.getAllForUser(userId, deepEqual(filter))).once();
        });
    });

    describe('get()', () => {
        it('should throw a not found error when the item does not exist', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const notificationId = 1;

            when(mockManager.getForUser(userId, notificationId)).thenResolve(undefined);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.get(notificationId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Notification not found');
        });

        it('should return a notification', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const notification: Notification = {
                id: 1,
                type: NotificationType.TournamentWin,
                data: {},
                read: false,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockManager.getForUser(userId, notification.id)).thenResolve(notification);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.get(notification.id);

            // Then
            expect(result).to.equal(result);
            verify(mockManager.getForUser(userId, notification.id)).once();
        });
    });

    describe('markAsRead()', () => {
        it('should mark the notification as read and set a 200 status', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const notificationId = 1;
            const userType = UserType.Standard;

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            await controller.markAsRead(notificationId);

            // Then
            expect(controller.getStatus()).to.equal(200);
            verify(mockManager.setRead(notificationId, userId, true)).once();
        });
    });

    describe('markAsUnread()', () => {
        it('should mark the notification as unread and set a 200 status', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const notificationId = 1;
            const userType = UserType.Standard;

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            await controller.markAsUnread(notificationId);

            // Then
            expect(controller.getStatus()).to.equal(200);
            verify(mockManager.setRead(notificationId, userId, false)).once();
        });
    });

    describe('count()', () => {
        it('should return notification count', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const count = Math.floor(Math.random() * Math.floor(100));
            const read = false;

            const controller = getController();

            when(mockManager.count(userId, read)).thenResolve(count);

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.count(read);

            // Then
            expect(result.count).to.equal(count);
            verify(mockManager.count(userId, read)).once();
        });
    });
});