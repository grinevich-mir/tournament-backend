import { describe, it, beforeEach } from '@tcom/test';
import { mock, instance, reset, when, mockUserRequest, verify, mockUser } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { VerificationController } from '../../src/controllers/verification.controller';
import { VerificationManager, VerificationRequest, VerificationProvider, VerificationRequestState, VerificationAttachmentType, VerificationAttachment, VerificationAttachmentState } from '@tcom/platform/lib/verification';
import { User, UserType } from '@tcom/platform/lib/user';

describe('VerificationController', () => {
    const mockVerificationManager = mock(VerificationManager);

    function getController(): VerificationController {
        return new VerificationController(
            instance(mockVerificationManager));
    }

    beforeEach(() => {
        reset(mockVerificationManager);
    });

    describe('start()', () => {
        it('should start the verification process', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const provider = VerificationProvider.S3;
            const requestId = 'dcafbfc1-215f-4196-94c7-c462be031302';

            const verificationRequest: VerificationRequest = {
                id: requestId,
                userId,
                attachments: [],
                displayName: 'Blarp',
                userLevel: 0,
                userEnabled: true,
                provider,
                state: VerificationRequestState.Pending,
                expireTime: new Date(),
                createTime: new Date()
            };

            when(mockVerificationManager.start(provider, userId)).thenResolve(verificationRequest);

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
            const result = await controller.start();

            // Then
            expect(result).to.exist;
            expect(result.id).to.equals(requestId);
        });
    });

    describe('getUploadUrl()', () => {
        it('should return an upload URL', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const attachmentId = '1cbec395-cc04-4917-98ac-97aae64b6699';
            const requestId = 'dcafbfc1-215f-4196-94c7-c462be031302';
            const documentType = VerificationAttachmentType.BankStatement;
            const contentType = 'jpg';
            const uploadUrl = 'https://verification-upload-url.com/upload-destination';

            const attachment: VerificationAttachment = {
                id: attachmentId,
                requestId,
                state: VerificationAttachmentState.Pending,
                type: documentType,
                createTime: new Date()
            };

            when(mockVerificationManager.addAttachment(userId, documentType, contentType)).thenResolve([attachment, uploadUrl]);

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
            const result = await controller.getUploadUrl(documentType, contentType);

            // Then
            expect(result).to.exist;
            expect(result.id).to.equals(attachmentId);
            expect(result.url).to.equals(uploadUrl);
        });
    });

    describe('finish()', () => {
        it('should validate attachments', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
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
            await controller.finish();

            // Then
            verify(mockVerificationManager.validateAttachments(userId)).once();
        });
    });
});