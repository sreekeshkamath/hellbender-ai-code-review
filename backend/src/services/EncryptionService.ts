import * as crypto from 'crypto';
import { getEncryptionKey, IV_LENGTH, ALGORITHM } from '../config/constants';

export class EncryptionService {
  private static getKey(): Buffer {
    return Buffer.from(getEncryptionKey().padEnd(32).slice(0, 32));
  }

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string): string | null {
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 2) return null;
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedData = parts[1];
      const decipher = crypto.createDecipheriv(ALGORITHM, this.getKey(), iv);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      return null;
    }
  }
}