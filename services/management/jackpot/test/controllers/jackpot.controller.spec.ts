import { describe, it } from '@tcom/test';
import { mock, when, instance, verify, reset, deepEqual, mockAdminUser, mockUserRequest } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { JackpotController } from '../../src/controllers/jackpot.controller';
import { Jackpot, JackpotAdjustmentPurpose, JackpotManager, JackpotType, JackpotUpdate } from '@tcom/platform/lib/jackpot';
import { NotFoundError } from '@tcom/platform/lib/core';
import { AdminUser } from '@tcom/platform/lib/api';
import { JackpotAdjustmentModel } from '../../src/models';

const jackpot: Jackpot[] = [{
    id: 1,
    type: JackpotType.Progressive,
    name: 'Hi-Lo Leaderboard Mini Jackpot',
    label: 'Mini',
    seed: 100,
    splitPayout: true,
    balance: 1390.1,
    balanceUpdateTime: new Date(),
    contributionGroup: 'mini',
    contributionMultiplier: 0.1,
    enabled: true,
    lastPayoutTime: new Date(),
    lastPayoutAmount: 4731.4,
    createTime: new Date(),
    updateTime: new Date()
}];

describe('JackpotController', () => {
    const mockJackpotManager = mock(JackpotManager);

    function getController(): JackpotController {
        return new JackpotController(instance(mockJackpotManager));
    }

    beforeEach(() => reset(mockJackpotManager));

    describe('getAll()', () => {
        it('should return all jackpots', async () => {
            // Given
            when(mockJackpotManager.getAll()).thenResolve(jackpot);

            const controller = getController();

            // When
            const result = await controller.getAll();

            // Then
            expect(result[0].type).to.equal('Progressive');
            verify(mockJackpotManager.getAll());
        });
    });

    describe('get()', () => {
        it('should return a jackpot', async () => {
            // Given
            when(mockJackpotManager.get(1)).thenResolve(jackpot[0]);

            const controller = getController();

            // When
            const result = await controller.get(1);

            // Then
            expect(result.type).to.equal('Progressive');
            verify(mockJackpotManager.get(1)).once();
        });

        it('should throw a not found error if no jackpot is returned', async () => {
            // Given
            when(mockJackpotManager.get(1)).thenResolve();

            const controller = getController();

            // When
            const delegate = async () => controller.get(1);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Jackpot not found.');
        });
    });

    describe('update()', () => {
        const currentFixedJackpot: Jackpot = {
            id: 1,
            type: JackpotType.Fixed,
            name: 'Hi-Lo Leaderboard Mini Jackpot',
            label: 'Mini Updated',
            enabled: true,
            createTime: new Date(),
            updateTime: new Date(),
            seed: 100,
            balance: 1390.1,
            balanceUpdateTime: new Date(),
            splitPayout: true,
            lastPayoutTime: new Date(),
            lastPayoutAmount: 4731.4,
        };

        const updatedFixedJackpot: Jackpot = {
            id: 1,
            type: JackpotType.Fixed,
            name: 'Hi-Lo Leaderboard Mini Jackpot Updated',
            label: 'Mini Jackpot Updated',
            seed: 150,
            splitPayout: false,
            balance: 1390.1,
            balanceUpdateTime: new Date(),
            enabled: true,
            lastPayoutTime: new Date(),
            lastPayoutAmount: 4731.4,
            createTime: new Date(),
            updateTime: new Date()
        };

        const jackpotUpdate: JackpotUpdate = {
            type: JackpotType.Fixed,
            name: 'Hi-Lo Leaderboard Mini Jackpot Updated',
            label: 'Mini Jackpot Updated',
            seed: 150,
            splitPayout: true
        };

        it('should updates a fixed jackpot', async () => {
            // Given
            when(mockJackpotManager.get(1)).thenResolve(currentFixedJackpot);
            when(mockJackpotManager.update(1, deepEqual(jackpotUpdate))).thenResolve(updatedFixedJackpot);

            const controller = getController();

            // When
            const result = await controller.update(1, jackpotUpdate);

            // Then
            expect(result.name).to.equal('Hi-Lo Leaderboard Mini Jackpot Updated');
            expect(result.label).to.equal('Mini Jackpot Updated');
            verify(mockJackpotManager.get(1)).once();
            verify(mockJackpotManager.update(1, deepEqual(jackpotUpdate))).once();
        });

        it('should update a progressive jackpot', async () => {
            // Given
            const updatedProgressiveJackpot: Jackpot = {
                id: 1,
                type: JackpotType.Progressive,
                name: 'Hi-Lo Leaderboard Mini Jackpot Updated',
                label: 'Mini Jackpot Updated',
                seed: 100,
                splitPayout: true,
                balance: 1390.1,
                balanceUpdateTime: new Date(),
                contributionGroup: 'mini',
                contributionMultiplier: 0.1,
                enabled: true,
                lastPayoutTime: new Date(),
                lastPayoutAmount: 4731.4,
                createTime: new Date(),
                updateTime: new Date()
            };

            const updatedJackpot: JackpotUpdate = {
                type: JackpotType.Progressive,
                name: 'Hi-Lo Leaderboard Mini Jackpot Updated',
                label: 'Mini Jackpot Updated',
                seed: 150,
                splitPayout: true,
                contributionGroup: 'mini updated',
                contributionMultiplier: 0.5,
                maxBalance: 10,
                maxContribution: 2
            };

            when(mockJackpotManager.get(1)).thenResolve(jackpot[0]);
            when(mockJackpotManager.update(1, deepEqual(updatedJackpot))).thenResolve(updatedProgressiveJackpot);

            const controller = getController();

            // When
            const result = await controller.update(1, updatedJackpot);

            // Then
            expect(result.name).to.equal('Hi-Lo Leaderboard Mini Jackpot Updated');
            expect(result.label).to.equal('Mini Jackpot Updated');
            verify(mockJackpotManager.get(1)).once();
            verify(mockJackpotManager.update(1, deepEqual(updatedJackpot))).once();
        });

        it('should throw an error if the jackpot type is not supported', async () => {
            const tangibleJackpot: Jackpot = {
                id: 1,
                type: JackpotType.Tangible,
                name: 'Hi-Lo Leaderboard Mini Jackpot',
                label: 'Mini',
                enabled: true,
                createTime: new Date(),
                updateTime: new Date(),
                imageUrl: 'image:url'
            };

            const updateJackpot: JackpotUpdate = {
                type: JackpotType.Fixed,
                label: 'Updated Jackpot',
                name: 'Hi-Lo New Jackpot',
                seed: 150,
                splitPayout: true
            };

            // Given
            when(mockJackpotManager.get(1)).thenResolve(tangibleJackpot);

            const controller = getController();

            // When
            const delegate = async () => controller.update(1, updateJackpot);

            // Then
            await expect(delegate()).to.be.rejectedWith('Jackpot type Tangible is not supported.');
        });

        it('should throw a not found error if no jackpot is returned', async () => {
            // Given
            when(mockJackpotManager.get(1)).thenResolve();

            const controller = getController();

            // When
            const delegate = async () => controller.update(1, jackpotUpdate);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Jackpot not found.');
        });
    });

    describe('enable()', () => {
        it('should enable a jackpot', async () => {
            // Given
            when(mockJackpotManager.setEnabled(1, true)).thenResolve();

            const controller = getController();

            // When
            await controller.enable(1);

            // Then
            verify(mockJackpotManager.setEnabled(1, true)).once();
        });
    });

    describe('disable()', () => {
        it('should disable a jackpot', async () => {
            // Given
            when(mockJackpotManager.setEnabled(1, false)).thenResolve();

            const controller = getController();

            // When
            await controller.disable(1);

            // Then
            verify(mockJackpotManager.setEnabled(1, false)).once();
        });
    });

    describe('adjust()', () => {
        const adjustment: JackpotAdjustmentModel = {
            amount: 10,
            purpose: JackpotAdjustmentPurpose.Correction,
        };

        const request = mockUserRequest<AdminUser>({
            user: mockAdminUser({
                id: '999',
                username: 'AdminUser'
            })
        });

        it('should add an adjustment to a jackpot', async () => {
            // Given
            when(mockJackpotManager.adjust(1, adjustment.amount, adjustment.purpose, `Employee:999`)).thenResolve(100);

            const controller = getController();
            controller.setRequest(instance(request));

            // When
            const result = await controller.adjust(1, adjustment);

            // Then
            expect(result).to.equal(100);
            verify(mockJackpotManager.adjust(1, adjustment.amount, adjustment.purpose, `Employee:999`)).once();
        });
    });

    describe('reset()', () => {
        const request = mockUserRequest<AdminUser>({
            user: mockAdminUser({
                id: '999',
                username: 'AdminUser'
            })
        });

        it('should reset a jackpot', async () => {
            // Given
            when(mockJackpotManager.reset(1, `Employee:999`)).thenResolve(10);

            const controller = getController();
            controller.setRequest(instance(request));

            // When
            const result = await controller.reset(1);

            // Then
            expect(result).to.equal(10);
            verify(mockJackpotManager.reset(1, `Employee:999`)).once();
        });
    });
});