import { describe, it } from '@tcom/test';
import { expect } from '@tcom/test/assert';
import { RequesterType, WithdrawalProvider, WithdrawalRequest, WithdrawalRequestStatus } from '@tcom/platform/lib/banking';
import { PayPalWithdrawalRequestExporter } from '@tcom/platform/lib/banking/providers/paypal';

describe('PayPalWithdrawalRequestExporter', () => {
    describe('export()', () => {
        it('should throw error if empty withdrawal requests argument is supplied', () => {
            // Given
            const requests: WithdrawalRequest[] = [];

            const exporter = new PayPalWithdrawalRequestExporter();

            // When
            const delegate = async () => exporter.export(requests);

            // Then
            expect(delegate()).to.be.rejectedWith(Error, 'Withdrawal requests not supplied');
        });

        it('should throw error if withdrawal requests contain item invalid provider', () => {
            // Given
            const userId = 1;
            const requests: WithdrawalRequest[] = [
                {
                    id: 'b3a535a3-62de-4fee-8e2d-7bf3195b4e07',
                    provider: 'WrongProvider' as WithdrawalProvider,
                    providerRef: 'test@tournament.com',
                    amount: 200,
                    currencyCode: 'USD',
                    requesterId: userId.toString(),
                    requesterType: RequesterType.User,
                    status: WithdrawalRequestStatus.Pending,
                    targetCompletionTime: new Date(),
                    userId,
                    walletEntryId: 1,
                    createTime: new Date(),
                    updateTime: new Date()
                }
            ];

            const exporter = new PayPalWithdrawalRequestExporter();

            // When
            const delegate = async () => exporter.export(requests);

            // Then
            expect(delegate()).to.be.rejectedWith(Error, 'Supplied withdrawal requests contain invalid provider');
        });

        it('should generate csv data in the correct format', () => {
            // Given
            const userId = 1;
            const providerRef = 'test@tournament.com';
            const amount = 250;
            const currencyCode = 'USD';
            const expected = `${providerRef},${amount},${currencyCode},${userId},,PAYPAL`;

            const requests: WithdrawalRequest[] = [
                {
                    id: 'b3a535a3-62de-4fee-8e2d-7bf3195b4e07',
                    provider: WithdrawalProvider.PayPal,
                    providerRef,
                    amount,
                    currencyCode,
                    requesterId: userId.toString(),
                    requesterType: RequesterType.User,
                    status: WithdrawalRequestStatus.Pending,
                    targetCompletionTime: new Date(),
                    userId,
                    walletEntryId: 1,
                    createTime: new Date(),
                    updateTime: new Date()
                }
            ];

            const exporter = new PayPalWithdrawalRequestExporter();

            // When
            const result = exporter.export(requests);

            // Then
            expect(result.data).is.equal(expected);
        });
    });
});