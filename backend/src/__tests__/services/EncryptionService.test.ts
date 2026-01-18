import { EncryptionService } from '../../services/EncryptionService';

describe('EncryptionService', () => {
  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt text correctly', () => {
      const originalText = 'test data';
      const encrypted = EncryptionService.encrypt(originalText);
      const decrypted = EncryptionService.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should return null for invalid encrypted text', () => {
      const invalid = 'invalid';
      const result = EncryptionService.decrypt(invalid);

      expect(result).toBeNull();
    });
  });
});