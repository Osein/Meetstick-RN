import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import forge from 'node-forge';
import type {VerifyOtpResponse} from '@/services/auth/authService';

const STORAGE_KEY = 'meetstick_user_profile_encrypted';
const AES_KEY_STORAGE_KEY = 'meetstick_user_aes_key';
const RSA_PUBLIC_KEY_STORAGE_KEY = 'meetstick_user_rsa_public_key';
const RSA_PRIVATE_KEY_STORAGE_KEY = 'meetstick_user_rsa_private_key';

type RsaKeyPair = {
  publicKeyPem: string;
  privateKeyPem: string;
};

type RsaEncryptedPayload = {
  algorithm: 'RSA-OAEP-SHA256';
  chunks: string[];
};

type AesEncryptedPayload = {
  algorithm: 'AES-GCM-256';
  iv: string;
  ciphertext: string;
  tag: string;
};

export class MeetstickSecureKeyValueStorage {
  private getRsaChunkByteSize(publicKeyPem: string): number {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const keyLengthBytes = Math.ceil(publicKey.n.bitLength() / 8);
    const sha256Length = 32;
    return keyLengthBytes - 2 * sha256Length - 2;
  }

  private encryptWithRsa(publicKeyPem: string, plainText: string): RsaEncryptedPayload {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const binaryPayload = forge.util.encodeUtf8(plainText);
    const chunkByteSize = this.getRsaChunkByteSize(publicKeyPem);
    const chunks: string[] = [];

    for (let offset = 0; offset < binaryPayload.length; offset += chunkByteSize) {
      const chunk = binaryPayload.slice(offset, offset + chunkByteSize);
      const encrypted = publicKey.encrypt(chunk, 'RSA-OAEP', {
        md: forge.md.sha256.create()
      });
      chunks.push(forge.util.encode64(encrypted));
    }

    return {
      algorithm: 'RSA-OAEP-SHA256',
      chunks
    };
  }

  private async getOrCreateAesKey(): Promise<string> {
    const savedKey = await SecureStore.getItemAsync(AES_KEY_STORAGE_KEY);
    if (savedKey && savedKey.trim().length > 0) {
      return savedKey;
    }

    const keyBytes = forge.random.getBytesSync(32);
    const encodedKey = forge.util.encode64(keyBytes);
    await SecureStore.setItemAsync(AES_KEY_STORAGE_KEY, encodedKey);
    return encodedKey;
  }

  private async getOrCreateRsaKeyPair(): Promise<RsaKeyPair> {
    const [savedPublicKey, savedPrivateKey] = await Promise.all([
      SecureStore.getItemAsync(RSA_PUBLIC_KEY_STORAGE_KEY),
      SecureStore.getItemAsync(RSA_PRIVATE_KEY_STORAGE_KEY)
    ]);

    if (savedPublicKey && savedPrivateKey) {
      return {
        publicKeyPem: savedPublicKey,
        privateKeyPem: savedPrivateKey
      };
    }

    const generated = forge.pki.rsa.generateKeyPair({bits: 2048, e: 0x10001});
    const publicKeyPem = forge.pki.publicKeyToPem(generated.publicKey);
    const privateKeyPem = forge.pki.privateKeyToPem(generated.privateKey);

    await Promise.all([
      SecureStore.setItemAsync(RSA_PUBLIC_KEY_STORAGE_KEY, publicKeyPem),
      SecureStore.setItemAsync(RSA_PRIVATE_KEY_STORAGE_KEY, privateKeyPem)
    ]);

    return {publicKeyPem, privateKeyPem};
  }

  private decryptWithRsa(privateKeyPem: string, payload: RsaEncryptedPayload): string {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const decryptedBinary = payload.chunks
      .map(chunk => {
        const encryptedBytes = forge.util.decode64(chunk);
        return privateKey.decrypt(encryptedBytes, 'RSA-OAEP', {
          md: forge.md.sha256.create()
        });
      })
      .join('');

    return forge.util.decodeUtf8(decryptedBinary);
  }

  private encryptWithAes(encodedKey: string, plainText: string): AesEncryptedPayload {
    const keyBytes = forge.util.decode64(encodedKey);
    const ivBytes = forge.random.getBytesSync(12);
    const cipher = forge.cipher.createCipher('AES-GCM', keyBytes);
    cipher.start({iv: ivBytes, tagLength: 128});
    cipher.update(forge.util.createBuffer(forge.util.encodeUtf8(plainText)));
    cipher.finish();

    return {
      algorithm: 'AES-GCM-256',
      iv: forge.util.encode64(ivBytes),
      ciphertext: forge.util.encode64(cipher.output.getBytes()),
      tag: forge.util.encode64(cipher.mode.tag.getBytes())
    };
  }

  private decryptWithAes(encodedKey: string, payload: AesEncryptedPayload): string | null {
    const keyBytes = forge.util.decode64(encodedKey);
    const decipher = forge.cipher.createDecipher('AES-GCM', keyBytes);
    decipher.start({
      iv: forge.util.decode64(payload.iv),
      tag: forge.util.createBuffer(forge.util.decode64(payload.tag)),
      tagLength: 128
    });
    decipher.update(forge.util.createBuffer(forge.util.decode64(payload.ciphertext)));

    if (!decipher.finish()) {
      return null;
    }

    return forge.util.decodeUtf8(decipher.output.getBytes());
  }

  private isRsaPayload(payload: unknown): payload is RsaEncryptedPayload {
    return (
      !!payload &&
      typeof payload === 'object' &&
      (payload as {algorithm?: unknown}).algorithm === 'RSA-OAEP-SHA256' &&
      Array.isArray((payload as {chunks?: unknown}).chunks)
    );
  }

  private isAesPayload(payload: unknown): payload is AesEncryptedPayload {
    return (
      !!payload &&
      typeof payload === 'object' &&
      (payload as {algorithm?: unknown}).algorithm === 'AES-GCM-256' &&
      typeof (payload as {iv?: unknown}).iv === 'string' &&
      typeof (payload as {ciphertext?: unknown}).ciphertext === 'string' &&
      typeof (payload as {tag?: unknown}).tag === 'string'
    );
  }

  private async clearLegacyRsaKeys(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(RSA_PUBLIC_KEY_STORAGE_KEY),
      SecureStore.deleteItemAsync(RSA_PRIVATE_KEY_STORAGE_KEY)
    ]);
  }

  async saveUserProfile(profile: VerifyOtpResponse): Promise<void> {
    const serialized = JSON.stringify(profile);
    const encodedKey = await this.getOrCreateAesKey();
    const encryptedPayload = this.encryptWithAes(encodedKey, serialized);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedPayload));
  }

  async getUserProfile(): Promise<VerifyOtpResponse | null> {
    try {
      const encryptedRaw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!encryptedRaw) {
        return null;
      }

      const parsed = JSON.parse(encryptedRaw) as unknown;

      if (this.isAesPayload(parsed)) {
        const encodedKey = await SecureStore.getItemAsync(AES_KEY_STORAGE_KEY);
        if (!encodedKey) {
          return null;
        }

        const decrypted = this.decryptWithAes(encodedKey, parsed);
        return decrypted ? (JSON.parse(decrypted) as VerifyOtpResponse) : null;
      }

      if (this.isRsaPayload(parsed)) {
        const privateKeyPem = await SecureStore.getItemAsync(RSA_PRIVATE_KEY_STORAGE_KEY);
        if (!privateKeyPem) {
          return null;
        }

        const decrypted = this.decryptWithRsa(privateKeyPem, parsed);
        const profile = JSON.parse(decrypted) as VerifyOtpResponse;
        await this.saveUserProfile(profile);
        await this.clearLegacyRsaKeys();
        return profile;
      }

      return null;
    } catch {
      return null;
    }
  }

  async clearUserProfile(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await Promise.all([
      SecureStore.deleteItemAsync(AES_KEY_STORAGE_KEY),
      this.clearLegacyRsaKeys()
    ]);
  }

  async updateUserProfile(partial: Partial<VerifyOtpResponse>): Promise<void> {
    const current = await this.getUserProfile();
    if (!current) {
      return;
    }

    await this.saveUserProfile({
      ...current,
      ...partial
    });
  }
}
