import { describe, it } from '@tcom/test';
import { mock, instance, reset, when, verify, mockUserRequest, mockUser } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { UpgradeController } from '../../src/controllers/upgrade.controller';
import { UpgradeCodeManager, UpgradeCode } from '@tcom/platform/lib/upgrade';
import { User, UserType } from '@tcom/platform/lib/user';

describe('UpgradeController', () => {
    const mockUpgradeCodeManager = mock(UpgradeCodeManager);

    function getController(): UpgradeController {
        return new UpgradeController(instance(mockUpgradeCodeManager));
    }

    beforeEach(() => {
        reset(mockUpgradeCodeManager);
    });

    describe('getCode()', () => {
        it('should generate a code if one does not already exist', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const code = 'ABC12345';
            const expireTime = new Date();
            const processExpireTime = new Date();
            const upgradeCode: UpgradeCode = {
                userId,
                code,
                upgradeDuration: 30,
                upgradeLevel: 1,
                diamonds: 10,
                inventoryItemIds: [],
                expireTime,
                processExpireTime,
                createTime: new Date()
            };

            when(mockUpgradeCodeManager.getByUserId(userId)).thenResolve(undefined);
            when(mockUpgradeCodeManager.generate(userId)).thenResolve(upgradeCode);

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
            const result = await controller.getCode();

            // Then
            expect(result).to.exist;
            expect(result.code).to.equal(code);
            expect(result.expireTime).to.equal(expireTime);
            expect(result.processExpireTime).to.equal(processExpireTime);
            verify(mockUpgradeCodeManager.getByUserId(userId)).once();
            verify(mockUpgradeCodeManager.generate(userId)).once();
        });

        it('should return a code if it already exists', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const code = 'ABC12345';
            const expireTime = new Date();
            const processExpireTime = new Date();
            const upgradeCode: UpgradeCode = {
                userId,
                code,
                upgradeDuration: 30,
                upgradeLevel: 1,
                diamonds: 10,
                inventoryItemIds: [],
                expireTime,
                processExpireTime,
                createTime: new Date()
            };

            when(mockUpgradeCodeManager.getByUserId(userId)).thenResolve(upgradeCode);

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
            const result = await controller.getCode();

            // Then
            expect(result).to.exist;
            expect(result.code).to.equal(code);
            expect(result.expireTime).to.equal(expireTime);
            expect(result.processExpireTime).to.equal(processExpireTime);
            verify(mockUpgradeCodeManager.getByUserId(userId)).once();
        });
    });
});