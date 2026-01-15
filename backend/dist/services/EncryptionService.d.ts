export declare class EncryptionService {
    private static ENCRYPTION_KEY;
    private static IV_LENGTH;
    private static ALGORITHM;
    static encrypt(text: string): string;
    static decrypt(encryptedText: string): string | null;
}
