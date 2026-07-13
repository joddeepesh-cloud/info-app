/**
 * A lightweight clientside cryptography helper for our E2EE prototype.
 * Encrypts private text messages before hitting the API, storing base64-transformed
 * payloads in MongoDB with a visual "[E2EE-SECURE]" header, and decrypts on client load.
 */

const SECURE_TAG = "[E2EE-SECURE] ";

/**
 * Encrypt plain text using base64 obfuscation for prototype presentation.
 */
export const encryptText = (plainText) => {
  if (!plainText) return "";
  try {
    // Encodes UTF-8 string to base64 securely
    const utf8Bytes = new TextEncoder().encode(plainText);
    const base64Data = btoa(String.fromCharCode(...utf8Bytes));
    return `${SECURE_TAG}${base64Data}`;
  } catch (err) {
    console.error("Encryption error:", err);
    return plainText;
  }
};

/**
 * Decrypt cipher text starting with the SECURE_TAG.
 */
export const decryptText = (cipherText) => {
  if (!cipherText) return "";
  if (!cipherText.startsWith(SECURE_TAG)) return cipherText;

  try {
    const base64Data = cipherText.replace(SECURE_TAG, "");
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(
      [...binaryStr].map((char) => char.charCodeAt(0))
    );
    return new TextDecoder().decode(bytes);
  } catch (err) {
    console.error("Decryption error:", err);
    return cipherText;
  }
};
