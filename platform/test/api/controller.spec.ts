import { describe, it } from '@tcom/test';
import { mock, instance, spy, when } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { Request } from 'express';
import { Controller } from '../../src/api/controller';
import { HtmlResult, RedirectResult } from '../../src/api/result';
import path from 'path';

describe('Controller', () => {
    describe('setRequest()', () => {
        it('should set the controllers request', () => {
            // Given
            const request = mock<Request>();

            const controller = new Controller();

            // When
            controller.setRequest(instance(request));

            // Then
            expect(controller.request).to.equal(instance(request));
        });
    });

    describe('html()', () => {
        it('should return an HTMLResult instance with resolved file path', () => {
            // Given
            const filePath = 'a-file.txt';
            const resolvedFilePath = `resolved/${filePath}`;
            const pathSpy = spy(path);

            when(pathSpy.resolve(filePath)).thenReturn(resolvedFilePath);

            const controller = new Controller();

            // When
            const result = controller.html(filePath);

            // Then
            expect(result).to.exist;
            expect(result).to.be.instanceOf(HtmlResult);
            expect(result.filePath).to.equal(resolvedFilePath);
        });
    });

    describe('redirect()', () => {
        it('should return a RedirectResult instance', () => {
            // Given
            const url = 'https://a-redirect-url.com/destination';

            const controller = new Controller();

            // When
            const result = controller.redirect(url);

            // Then
            expect(result).to.exist;
            expect(result).to.be.instanceOf(RedirectResult);
        });
    });
});