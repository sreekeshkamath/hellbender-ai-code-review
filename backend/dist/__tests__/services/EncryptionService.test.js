"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EncryptionService_1 = require("../../services/EncryptionService");
describe('EncryptionService', () => {
    describe('encrypt and decrypt', () => {
        it('should encrypt and decrypt text correctly', () => {
            const originalText = 'test data';
            const encrypted = EncryptionService_1.EncryptionService.encrypt(originalText);
            const decrypted = EncryptionService_1.EncryptionService.decrypt(encrypted);
            expect(decrypted).toBe(originalText);
        });
        it('should return null for invalid encrypted text', () => {
            const invalid = 'invalid';
            const result = EncryptionService_1.EncryptionService.decrypt(invalid);
            expect(result).toBeNull();
        });
    });
});
