import { describe, it } from '@tcom/test';
import { mock, instance, verify, when, spy } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { RedirectResult, HtmlResult } from '../../src/api/result';
import { Response } from 'express';
import { NotFoundError } from '../../src/core';
import fs from 'fs';

describe('RedirectResult', () => {
    describe('handle()', () => {
        it('should call redirect on the response with temporary response code', () => {
            // Given
            const url = 'https://redirect-url.com/destination';
            const mockResponse = mock<Response>();

            const result = new RedirectResult(url);

            // When
            result.handle(instance(mockResponse));

            // Then
            verify(mockResponse.redirect(url, 302)).once();
        });

        it('should call redirect on the response with permanent response code', () => {
            // Given
            const url = 'https://redirect-url.com/destination';
            const permanent = true;
            const mockResponse = mock<Response>();

            const result = new RedirectResult(url, permanent);

            // When
            result.handle(instance(mockResponse));

            // Then
            verify(mockResponse.redirect(url, 301)).once();
        });
    });
});

describe('HtmlResult', () => {
    describe('handle()', () => {
        it('should throw a not found error if the file does not exist', () => {
            // Given
            const filePath = 'the-file-path/something/derp.html';

            const fsSpy = spy(fs);
            when(fsSpy.existsSync(filePath)).thenReturn(false);

            const mockResponse = mock<Response>();

            const result = new HtmlResult(filePath);

            // When
            const delegate = () => result.handle(instance(mockResponse));

            // Then
            expect(delegate).to.throw(NotFoundError, `File ${filePath} could not be found.`);
        });

        it('should return the html contents', () => {
            // Given
            const filePath = 'the-file-path/something/derp.html';
            const fileType = 'html';
            const template = 'Hello';

            const fsSpy = spy(fs);
            when(fsSpy.existsSync(filePath)).thenReturn(true);
            when(fsSpy.readFileSync(filePath, 'utf-8')).thenReturn(template);

            const mockResponse = mock<Response>();
            when(mockResponse.type(fileType)).thenReturn(instance(mockResponse));

            const result = new HtmlResult(filePath);

            // When
            result.handle(instance(mockResponse));

            // Then
            verify(mockResponse.send(template)).once();
        });

        it('should return the html contents with placeholders replaced', () => {
            // Given
            const filePath = 'the-file-path/something/derp.html';
            const fileType = 'html';
            const template = 'Hello {{ name }}!';
            const data = {
                name: 'Jeff'
            };
            const content = 'Hello Jeff!';

            const fsSpy = spy(fs);
            when(fsSpy.readFileSync(filePath, 'utf-8')).thenReturn(template);

            const mockResponse = mock<Response>();
            when(fsSpy.existsSync(filePath)).thenReturn(true);
            when(mockResponse.type(fileType)).thenReturn(instance(mockResponse));

            const result = new HtmlResult(filePath, data);

            // When
            result.handle(instance(mockResponse));

            // Then
            verify(mockResponse.send(content)).once();
        });
    });
});