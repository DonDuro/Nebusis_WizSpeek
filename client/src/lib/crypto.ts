// Simplified client-side encryption for demo purposes
// In production, this would use libsodium or similar

export const generateKeyPair = (): { publicKey: string; privateKey: string } => {
  // Mock key generation for demo
  return {
    publicKey: `pub_${Math.random().toString(36).substr(2, 9)}`,
    privateKey: `priv_${Math.random().toString(36).substr(2, 9)}`,
  };
};

export const encryptMessage = (message: string, publicKey: string): string => {
  // Mock encryption for demo - in production use proper E2E encryption
  return btoa(message + "_encrypted_with_" + publicKey);
};

export const decryptMessage = (encryptedMessage: string, privateKey: string): string => {
  // Mock decryption for demo
  try {
    const decoded = atob(encryptedMessage);
    return decoded.split("_encrypted_with_")[0];
  } catch {
    return encryptedMessage;
  }
};

export const encryptFile = (file: File, key: string): Promise<Blob> => {
  // Mock file encryption for demo
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const encrypted = btoa(reader.result as string + "_encrypted_with_" + key);
      resolve(new Blob([encrypted], { type: file.type }));
    };
    reader.readAsDataURL(file);
  });
};
