import type { PersistStorage } from "../types";

/**
 * Options for encrypted storage adapter
 */
export interface EncryptedStorageOptions {
  /**
   * Custom encryption function (must pair with decryption function)
   */
  encrypt?: (text: string, secret: string) => string;

  /**
   * Custom decryption function (must pair with encryption function)
   */
  decrypt?: (encryptedText: string, secret: string) => string | null;

  /**
   * Prefix to add to keys when storing in the underlying storage
   * @default "encrypted_"
   */
  keyPrefix?: string;

  /**
   * Whether to log errors to console
   * @default true
   */
  logErrors?: boolean;
}

// Simple built-in encryption implementation (for basic security only)
// In production, use a proper encryption library
const defaultEncrypt = (text: string, secret: string): string => {
  // This is a simple implementation for demonstration
  // DO NOT use this in production without proper security review
  const textBytes = new TextEncoder().encode(text);
  const secretBytes = new TextEncoder().encode(secret);

  // Basic XOR encryption (not secure for production)
  const encryptedBytes = new Uint8Array(textBytes.length);
  for (let i = 0; i < textBytes.length; i++) {
    encryptedBytes[i] = textBytes[i] ^ secretBytes[i % secretBytes.length];
  }

  // Convert to Base64
  return btoa(String.fromCharCode(...encryptedBytes));
};

// Simple built-in decryption implementation (for basic security only)
const defaultDecrypt = (
  encryptedText: string,
  secret: string
): string | null => {
  try {
    // Convert from Base64
    const encryptedBytes = new Uint8Array(
      atob(encryptedText)
        .split("")
        .map((char) => char.charCodeAt(0))
    );

    const secretBytes = new TextEncoder().encode(secret);

    // Basic XOR decryption
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes[i] =
        encryptedBytes[i] ^ secretBytes[i % secretBytes.length];
    }

    return new TextDecoder().decode(decryptedBytes);
  } catch (e) {
    console.error("Failed to decrypt data", e);
    return null;
  }
};

/**
 * Creates an encrypted storage adapter that wraps another storage mechanism.
 *
 * SECURITY WARNING: The built-in encryption is basic and for demonstration purposes.
 * For production use, provide your own encryption/decryption functions using a proper
 * cryptography library.
 *
 * @param baseStorage - The underlying storage to use
 * @param secret - Secret key for encryption/decryption
 * @param options - Optional configuration
 * @returns A storage adapter compatible with persist()
 *
 * @example
 * ```js
 * import { store, persist } from "jods";
 * import { createEncryptedStorage } from "jods/persist/adapters/secure";
 *
 * // Using with localStorage (with built-in simple encryption)
 * const secureStorage = createEncryptedStorage(localStorage, "my-secret-key");
 *
 * // Using with custom encryption (recommended for production)
 * import CryptoJS from 'crypto-js';
 *
 * const secureStorage = createEncryptedStorage(localStorage, "my-secret-key", {
 *   encrypt: (text, secret) => CryptoJS.AES.encrypt(text, secret).toString(),
 *   decrypt: (encrypted, secret) => {
 *     try {
 *       const bytes = CryptoJS.AES.decrypt(encrypted, secret);
 *       return bytes.toString(CryptoJS.enc.Utf8);
 *     } catch (e) {
 *       return null;
 *     }
 *   }
 * });
 *
 * const secureStore = store({
 *   username: "user123",
 *   secretToken: "sensitive-data"
 * });
 *
 * persist(secureStorage, secureStore, { key: "secure-data" });
 * ```
 */
export function createEncryptedStorage(
  baseStorage: PersistStorage,
  secret: string,
  options: EncryptedStorageOptions = {}
): PersistStorage {
  const {
    encrypt = defaultEncrypt,
    decrypt = defaultDecrypt,
    keyPrefix = "encrypted_",
    logErrors = true,
  } = options;

  const prefixKey = (key: string): string => `${keyPrefix}${key}`;

  return {
    async getItem(key) {
      try {
        const encryptedData = await baseStorage.getItem(prefixKey(key));
        if (!encryptedData) return null;

        return decrypt(encryptedData, secret);
      } catch (error) {
        if (logErrors) {
          console.error(`Failed to decrypt item ${key}:`, error);
        }
        return null;
      }
    },

    async setItem(key, value) {
      try {
        const encryptedValue = encrypt(value, secret);
        await baseStorage.setItem(prefixKey(key), encryptedValue);
      } catch (error) {
        if (logErrors) {
          console.error(`Failed to encrypt item ${key}:`, error);
        }
        throw error;
      }
    },

    async removeItem(key) {
      try {
        await baseStorage.removeItem?.(prefixKey(key));
      } catch (error) {
        if (logErrors) {
          console.error(`Failed to remove item ${key}:`, error);
        }
        throw error;
      }
    },
  };
}
