import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import forge from 'node-forge';
import {VerifyOtpResponse} from '@/services/auth/authService';

const STORAGE_KEY = 'meetstick_user_profile_encrypted';
const RSA_PUBLIC_KEY_STORAGE_KEY = 'meetstick_user_rsa_public_key';
const RSA_PRIVATE_KEY_STORAGE_KEY = 'meetstick_user_rsa_private_key';

type RsaKeyPair = {
  publicKeyPem: string;
  privateKeyPem: string;
};

type EncryptedPayload = {
  algorithm: 'RSA-OAEP-SHA256';
  chunks: string[];
};

export class MeetstickSecureKeyValueStorage {
  private getRsaChunkByteSize(publicKeyPem: string): number {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const keyLengthBytes = Math.ceil(publicKey.n.bitLength() / 8);
    const sha256Length = 32;
    return keyLengthBytes - 2 * sha256Length - 2;
  }

  private encryptWithRsa(publicKeyPem: string, plainText: string): EncryptedPayload {
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

  private decryptWithRsa(privateKeyPem: string, payload: EncryptedPayload): string {
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

  async saveUserProfile(profile: VerifyOtpResponse): Promise<void> {
    const serialized = JSON.stringify(profile);
    const {publicKeyPem} = await this.getOrCreateRsaKeyPair();
    const encryptedPayload = this.encryptWithRsa(publicKeyPem, serialized);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(encryptedPayload));
  }

  async getUserProfile(): Promise<VerifyOtpResponse | null> {
    try {
      const [encryptedRaw, privateKeyPem] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        SecureStore.getItemAsync(RSA_PRIVATE_KEY_STORAGE_KEY)
      ]);

      if (!encryptedRaw || !privateKeyPem) {
        return null;
      }

      const parsed = JSON.parse(encryptedRaw) as EncryptedPayload;
      if (!parsed || !Array.isArray(parsed.chunks) || parsed.chunks.length === 0) {
        return null;
      }

      const decrypted = this.decryptWithRsa(privateKeyPem, parsed);
      return JSON.parse(decrypted) as VerifyOtpResponse;
    } catch {
      return null;
    }
  }

  async clearUserProfile(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
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
