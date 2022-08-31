import { describe, it } from '@tcom/test';
import { instance, mockUser, mockUserRequest } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { ClientController } from '../../src/api/client-controller';
import { User, UserType } from '../../src/user';

describe('ClientController', () => {
    describe('user', () => {
        it('should return undefined when request is not set', () => {
            // Given
            const controller = new ClientController();

            // When
            const user = controller.user;

            // Then
            expect(user).to.be.undefined;
        });

        it('should return user', () => {
            // Given
            const user = mockUser({
                id: 1,
                secureId: 'abc123',
                skinId: 'tournament',
                type: UserType.Standard
            });
            const mockRequest = mockUserRequest<User>({ user });

            const controller = new ClientController();
            controller.setRequest(instance(mockRequest));

            // When
            const result = controller.user;

            // Then
            expect(result).to.equal(user);
        });
    });
});