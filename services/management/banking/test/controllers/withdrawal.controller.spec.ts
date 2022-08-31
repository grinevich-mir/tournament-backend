import { describe, it } from '@tcom/test';
import { mock, instance, verify, reset, when, deepEqual, mockAdminUser, mockUserRequest } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { User, UserAddressStatus, UserManager, UserRegistrationType, UserType, UserVerificationStatus } from '@tcom/platform/lib/user';
import { RequesterType, WithdrawalManager, WithdrawalProvider, WithdrawalRequest } from '@tcom/platform/lib/banking';
import { WithdrawalRequestExporter, WithdrawalRequestExporterFactory, WithdrawalRequestExportResult, WithdrawalRequestFilter, WithdrawalRequestIdFilter, WithdrawalRequestStatus, WithdrawalRequestStatusChangeResult } from '@tcom/platform/lib/banking';
import { WithdrawalController } from '../../src/controllers/withdrawal.controller';
import { BadRequestError, NotFoundError, PagedResult, ForbiddenError } from '@tcom/platform/lib/core';
import { WithdrawalRequestEnrichedModel } from '../../src/models/withdrawal-request-enriched.model';
import { WithdrawalRequestStatusUpdateModel } from '../../src/models/withdrawal-request-status-update.model';
import { WithdrawalRequestStatusBulkUpdateModel, WithdrawalRequestStatusBulkUpdateResultModel } from '../../src/models/withdrawal-request-status-update.model';
import { AdminUser } from '@tcom/platform/lib/api';

const withdrawalRequest: WithdrawalRequest[] = [{
    id: '5433b632-4a89-4be0-8aa8-497bfd585b18',
    provider: WithdrawalProvider.PayPal,
    providerRef: 'test@tournament.com',
    userId: 342,
    amount: 500,
    currencyCode: 'USD',
    requesterId: '999',
    requesterType: RequesterType.User,
    status: WithdrawalRequestStatus.Complete,
    targetCompletionTime: new Date(),
    completionTime: new Date(),
    walletEntryId: 311686,
    createTime: new Date(),
    updateTime: new Date(),
}];

const user: User = {
    id: 342,
    secureId: '12345',
    skinId: 'tournament',
    displayName: 'test username',
    type: UserType.Standard,
    regType: UserRegistrationType.Email,
    chatToken: '12345',
    level: 1,
    identityStatus: UserVerificationStatus.Verified,
    addressStatus: UserAddressStatus.Complete,
    enabled: true,
    consecutivePlayedDays: 10,
    subscribed: true,
    subscribing: false,
    hasPaymentMethod: false,
    createTime: new Date(),
    updateTime: new Date(),
    fraudulent: false,
};

const withdrawalRequestEnrichedModel: WithdrawalRequestEnrichedModel = {
    id: '5433b632-4a89-4be0-8aa8-497bfd585b18',
    provider: WithdrawalProvider.PayPal,
    providerRef: 'test@tournament.com',
    userId: 342,
    amount: 500,
    currencyCode: 'USD',
    requesterId: '999',
    requesterType: RequesterType.User,
    status: WithdrawalRequestStatus.Complete,
    targetCompletionTime: new Date(),
    completionTime: new Date(),
    walletEntryId: 311686,
    createTime: new Date(),
    updateTime: new Date(),
    username: 'test username'
};

describe('WithdrawalController', () => {
    const mockWithdrawalManager = mock(WithdrawalManager);
    const mockUserManager = mock(UserManager);
    const mockWithdrawalRequestExporterFactory = mock(WithdrawalRequestExporterFactory);

    function getController(): WithdrawalController {
        return new WithdrawalController(instance(mockWithdrawalManager), instance(mockUserManager), instance(mockWithdrawalRequestExporterFactory));
    }

    beforeEach(() => {
        reset(mockWithdrawalManager);
        reset(mockUserManager);
    });

    describe('getAll()', () => {
        const filter: WithdrawalRequestFilter = {
            userId: 342,
            status: WithdrawalRequestStatus.Complete,
            provider: WithdrawalProvider.PayPal,
            page: 1,
            pageSize: 20
        };

        it('should return all withdrawal requests', async () => {
            // Given
            when(mockWithdrawalManager.getAll(deepEqual(filter))).thenResolve(new PagedResult(withdrawalRequest, 10, 1, 20));
            when(mockUserManager.get(342)).thenResolve(user);

            const controller = getController();

            // When
            const result = await controller.getAll(342, WithdrawalRequestStatus.Complete, WithdrawalProvider.PayPal);

            // Then
            expect(result.items[0].username).to.equal('test username');
            expect(result.items[0].provider).to.equal('PayPal');
            verify(mockWithdrawalManager.getAll(deepEqual(filter))).once();
        });

        it('should return all withdrawal requests with username undefined', async () => {
            // Given
            when(mockWithdrawalManager.getAll(deepEqual(filter))).thenResolve(new PagedResult(withdrawalRequest, 10, 1, 20));
            when(mockUserManager.get(342)).thenResolve();

            const controller = getController();

            // When
            const result = await controller.getAll(342, WithdrawalRequestStatus.Complete, WithdrawalProvider.PayPal);

            // Then
            expect(result.items[0].username).to.equal(undefined);
            expect(result.items[0].provider).to.equal('PayPal');
            verify(mockWithdrawalManager.getAll(deepEqual(filter))).once();
        });
    });

    describe('getById()', () => {
        it('should return a withdrawal request by ID', async () => {
            // Given
            when(mockWithdrawalManager.get('342')).thenResolve(withdrawalRequestEnrichedModel);
            when(mockUserManager.get(342)).thenResolve(user);

            const controller = getController();

            // When
            const result = await controller.getById('342');

            // Then
            expect(result.username).to.equal('test username');
            verify(mockWithdrawalManager.get('342')).once();
            verify(mockUserManager.get(342)).once();
        });

        it('should return a withdrawal request by ID with username undefined', async () => {
            // Given
            when(mockWithdrawalManager.get('342')).thenResolve(withdrawalRequestEnrichedModel);
            when(mockUserManager.get(342)).thenResolve(undefined);

            const controller = getController();

            // When
            const result = await controller.getById('342');

            // Then
            expect(result.username).to.equal(undefined);
            verify(mockWithdrawalManager.get('342')).once();
            verify(mockUserManager.get(342)).once();
        });

        it('should throw a not found error if no withdrawal request by ID is returned', async () => {
            // Given
            when(mockWithdrawalManager.get('342')).thenResolve(undefined);
            when(mockUserManager.get(342)).thenResolve(user);

            const controller = getController();

            // When
            const delegate = async () => controller.getById('342');

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Withdrawal request not found.');
        });
    });

    describe('changeStatus()', () => {
        const request = mockUserRequest<AdminUser>({
            user: mockAdminUser({
                id: '999',
                username: 'AdminUser',
            })
        });

        it('should change the withdrawal request status Processing', async () => {
            // Given
            const update: WithdrawalRequestStatusUpdateModel = {
                status: WithdrawalRequestStatus.Processing
            };

            when(mockWithdrawalManager.get('5433b632-4a89-4be0-8aa8-497bfd585b18')).thenResolve(withdrawalRequestEnrichedModel);
            when(mockUserManager.get(342)).thenResolve(user);
            when(mockWithdrawalManager.processing('5433b632-4a89-4be0-8aa8-497bfd585b18')).thenResolve();

            const controller = getController();

            // When
            await controller.changeStatus('5433b632-4a89-4be0-8aa8-497bfd585b18', update);

            // Then
            verify(mockWithdrawalManager.processing('5433b632-4a89-4be0-8aa8-497bfd585b18')).once();
        });

        it('should change the withdrawal request status Complete', async () => {
            // Given
            const update: WithdrawalRequestStatusUpdateModel = {
                status: WithdrawalRequestStatus.Complete
            };

            when(mockWithdrawalManager.get('5433b632-4a89-4be0-8aa8-497bfd585b18')).thenResolve(withdrawalRequestEnrichedModel);
            when(mockUserManager.get(342)).thenResolve(user);
            when(mockWithdrawalManager.complete('5433b632-4a89-4be0-8aa8-497bfd585b18', '999')).thenResolve();

            const controller = getController();

            controller.setRequest(instance(request));

            // When
            await controller.changeStatus('5433b632-4a89-4be0-8aa8-497bfd585b18', update);

            // Then
            verify(mockWithdrawalManager.complete('5433b632-4a89-4be0-8aa8-497bfd585b18', '999')).once();
        });

        it('should change the withdrawal request status Cancelled', async () => {
            // Given
            const update: WithdrawalRequestStatusUpdateModel = {
                status: WithdrawalRequestStatus.Cancelled
            };

            when(mockWithdrawalManager.get('5433b632-4a89-4be0-8aa8-497bfd585b18')).thenResolve(withdrawalRequestEnrichedModel);
            when(mockUserManager.get(342)).thenResolve(user);
            when(mockWithdrawalManager.cancel('5433b632-4a89-4be0-8aa8-497bfd585b18', '999')).thenResolve();

            const controller = getController();

            controller.setRequest(instance(request));

            // When
            await controller.changeStatus('5433b632-4a89-4be0-8aa8-497bfd585b18', update);

            // Then
            verify(mockWithdrawalManager.cancel('5433b632-4a89-4be0-8aa8-497bfd585b18', '999')).once();
        });

        it('should throw a not found error if no withdrawal request by ID is returned', async () => {
            // Given
            const update: WithdrawalRequestStatusUpdateModel = {
                status: WithdrawalRequestStatus.Processing
            };

            when(mockWithdrawalManager.get('5433b632-4a89-4be0-8aa8-497bfd585b18')).thenResolve(undefined);

            const controller = getController();

            // When
            const delegate = async () => controller.changeStatus('5433b632-4a89-4be0-8aa8-497bfd585b18', update);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Withdrawal request not found.');
        });

        it('should throw a User is under review error if fraudulent is set to true', async () => {
            // Given
            const update: WithdrawalRequestStatusUpdateModel = {
                status: WithdrawalRequestStatus.Processing
            };

            const fraudulentUser = {
                ...user,
                fraudulent: true,
            };

            when(mockWithdrawalManager.get('5433b632-4a89-4be0-8aa8-497bfd585b18')).thenResolve(withdrawalRequestEnrichedModel);
            when(mockUserManager.get(342)).thenResolve(fraudulentUser);

            const controller = getController();

            // When
            const delegate = async () => controller.changeStatus('5433b632-4a89-4be0-8aa8-497bfd585b18', update);

            // Then
            await expect(delegate()).to.be.rejectedWith(ForbiddenError, 'User is under review');
        });
    });

    describe('bulkChangeStatus()', () => {
        const request = mockUserRequest<AdminUser>({
            user: mockAdminUser({
                id: '999',
                username: 'AdminUser'
            })
        });

        it('should throw error if no withdrawal request ids are supplied', async () => {
            // Given
            const update: WithdrawalRequestStatusBulkUpdateModel = {
                status: WithdrawalRequestStatus.Processing,
                ids: []
            };

            const controller = getController();

            // When
            const delegate = async () => controller.bulkChangeStatus(update);

            // Then
            await expect(delegate()).to.be.rejectedWith(BadRequestError, 'No withdrawal request IDs supplied');
        });

        it('should bulk change withdrawal requests to new status', async () => {
            // Given
            const req = instance(request);
            const first = '5433b632-4a89-4be0-8aa8-497bfd585b18';
            const second = '5433b632-4a89-4be0-8aa8-497bfd585a22';

            const update: WithdrawalRequestStatusBulkUpdateModel = {
                status: WithdrawalRequestStatus.Processing,
                ids: [first, second]
            };

            const firstUpdateResult: WithdrawalRequestStatusChangeResult = {
                id: first,
                success: true
            };

            const secondUpdateResult: WithdrawalRequestStatusChangeResult = {
                id: second,
                success: true
            };

            const updateResults: WithdrawalRequestStatusChangeResult[] = [
                firstUpdateResult,
                secondUpdateResult
            ];

            const expected: WithdrawalRequestStatusBulkUpdateResultModel = { results: updateResults, success: true };

            when(mockWithdrawalManager.bulkChangeStatus(update.status, update.ids, req.user.id)).thenResolve(updateResults);

            const controller = getController();
            controller.setRequest(instance(request));

            // When
            const result = await controller.bulkChangeStatus(update);

            // Then
            expect(result).to.deep.equal(expected);
            verify(mockWithdrawalManager.bulkChangeStatus(update.status, update.ids, req.user.id)).once();
        });

        it('should set success flag to false if one of the bulk updates fail', async () => {
            // Given
            const req = instance(request);
            const first = '5433b632-4a89-4be0-8aa8-497bfd585b18';
            const second = '5433b632-4a89-4be0-8aa8-497bfd585a22';

            const update: WithdrawalRequestStatusBulkUpdateModel = {
                status: WithdrawalRequestStatus.Processing,
                ids: [first, second]
            };

            const firstUpdateResult: WithdrawalRequestStatusChangeResult = {
                id: first,
                success: true
            };

            const secondUpdateResult: WithdrawalRequestStatusChangeResult = {
                id: second,
                success: false,
                message: 'Failed to update withdraw request'
            };

            const updateResults: WithdrawalRequestStatusChangeResult[] = [
                firstUpdateResult,
                secondUpdateResult
            ];

            const expected: WithdrawalRequestStatusBulkUpdateResultModel = { results: updateResults, success: false };

            when(mockWithdrawalManager.bulkChangeStatus(update.status, update.ids, req.user.id)).thenResolve(updateResults);

            const controller = getController();
            controller.setRequest(instance(request));

            // When
            const result = await controller.bulkChangeStatus(update);

            // Then
            expect(result).to.deep.equal(expected);
            verify(mockWithdrawalManager.bulkChangeStatus(update.status, update.ids, req.user.id)).once();
        });
    });

    describe('export()', () => {
        it('should throw error if no withdrawal request ids are supplied', async () => {
            // Given
            const provider = WithdrawalProvider.PayPal;
            const filter: WithdrawalRequestIdFilter = {
                ids: []
            };

            const controller = getController();

            // When
            const delegate = async () => controller.export(provider, filter);

            // Then
            await expect(delegate()).to.be.rejectedWith(BadRequestError, 'No withdrawal request IDs supplied');
        });

        it('should return data in csv file format', async () => {
            // Given
            const id = '5433b632-4a89-4be0-8aa8-497bfd585b18';
            const provider = WithdrawalProvider.PayPal;
            const filter: WithdrawalRequestIdFilter = {
                ids: [id]
            };

            const requests: WithdrawalRequest[] = [];

            const exportResult: WithdrawalRequestExportResult = {
                data: 'Here is some data',
                fileName: 'filename'
            };

            const exporter = mock<WithdrawalRequestExporter>();

            when(exporter.export(requests)).thenReturn(exportResult);
            when(mockWithdrawalRequestExporterFactory.create(provider)).thenReturn(instance(exporter));
            when(mockWithdrawalManager.getMany(...filter.ids)).thenResolve(requests);

            const controller = getController();

            // When
            const result = await controller.export(provider, filter);

            // Then
            expect(result.data).to.equal(exportResult.data);
            expect(result.fileName).to.equal(exportResult.fileName);
            expect(result.contentType).to.equal('text/csv');
            verify(mockWithdrawalRequestExporterFactory.create(provider)).once();
            verify(mockWithdrawalManager.getMany(...filter.ids)).once();
            verify(exporter.export(requests)).once();
        });
    });
});