import { Preferences } from '@capacitor/preferences';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

export interface PermissionState {
  supported: boolean;
  granted: boolean;
  denied: boolean;
  message?: string;
}

export interface SecuritySettings {
  biometricLoginEnabled: boolean;
  appLockEnabled: boolean;
  biometricPromptSeen: boolean;
}

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  biometricLoginEnabled: false,
  appLockEnabled: false,
  biometricPromptSeen: false,
};

export function checkStorageAvailability(): PermissionState {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return {
      supported: false,
      granted: false,
      denied: true,
      message: 'Storage is not available in this environment.',
    };
  }

  try {
    const testKey = 'pulsefit.storage-test';
    window.localStorage.setItem(testKey, 'ok');
    window.localStorage.removeItem(testKey);

    return {
      supported: true,
      granted: true,
      denied: false,
    };
  } catch {
    return {
      supported: false,
      granted: false,
      denied: true,
      message: 'Storage access is blocked. Please allow local storage to continue using PulseFit.',
    };
  }
}

export function safeReadStorage(key: string): string | null {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeWriteStorage(key: string, value: string): boolean {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveStorage(key: string): boolean {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export async function loadSecuritySettings(): Promise<SecuritySettings> {
  try {
    const response = await Preferences.get({ key: 'pulsefit.securitySettings' });
    const storedSettings = response.value ? JSON.parse(response.value) as Partial<SecuritySettings> : null;

    return {
      biometricLoginEnabled: Boolean(storedSettings?.biometricLoginEnabled),
      appLockEnabled: Boolean(storedSettings?.appLockEnabled),
      biometricPromptSeen: Boolean(storedSettings?.biometricPromptSeen),
    };
  } catch {
    return { ...DEFAULT_SECURITY_SETTINGS };
  }
}

export async function saveSecuritySettings(settings: SecuritySettings): Promise<boolean> {
  try {
    await Preferences.set({
      key: 'pulsefit.securitySettings',
      value: JSON.stringify(settings),
    });
    return true;
  } catch {
    return false;
  }
}

export async function saveSecureSessionToken(token?: string): Promise<boolean> {
  if (!token) {
    return false;
  }

  try {
    await Promise.allSettled([
      SecureStoragePlugin.set({
        key: 'pulsefit.authToken',
        value: token,
      }),
      safeWriteStorage('pulsefit.authToken', token),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function readSecureSessionToken(): Promise<string | null> {
  try {
    const secureResponse = await SecureStoragePlugin.get({ key: 'pulsefit.authToken' });
    return secureResponse?.value || null;
  } catch {
    const storageValue = safeReadStorage('pulsefit.authToken');
    return storageValue || null;
  }
}

export async function clearSecureSessionToken(): Promise<boolean> {
  try {
    await Promise.allSettled([
      SecureStoragePlugin.remove({ key: 'pulsefit.authToken' }),
      Preferences.remove({ key: 'pulsefit.authToken' }),
      safeRemoveStorage('pulsefit.authToken'),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function checkBiometricAvailability(): Promise<PermissionState> {
  try {
    const result = await BiometricAuth.checkBiometry();

    if (result.isAvailable) {
      return {
        supported: true,
        granted: true,
        denied: false,
        message: 'Biometric authentication is available.',
      };
    }

    return {
      supported: false,
      granted: false,
      denied: true,
      message: result.reason || 'Biometric authentication is not available on this device.',
    };
  } catch (error) {
    return {
      supported: false,
      granted: false,
      denied: true,
      message: error instanceof Error ? error.message : 'Biometric authentication could not be checked on this device.',
    };
  }
}

export async function performBiometricAuthentication(reason = 'Unlock PulseFit'): Promise<boolean> {
  try {
    const available = await checkBiometricAvailability();

    if (!available.supported || available.denied) {
      return false;
    }

    await BiometricAuth.authenticate({
      reason,
      allowDeviceCredential: true,
      androidTitle: 'Unlock PulseFit',
      androidSubtitle: 'Authenticate to continue',
    });

    return true;
  } catch {
    return false;
  }
}

export function requestMediaPicker(
  inputElement: HTMLInputElement | null,
  options?: { accept?: string; capture?: 'user' | 'environment' }
): PermissionState {
  if (typeof window === 'undefined' || typeof HTMLInputElement === 'undefined') {
    return {
      supported: false,
      granted: false,
      denied: true,
      message: 'Media picker is unavailable in this environment.',
    };
  }

  if (!inputElement) {
    return {
      supported: false,
      granted: false,
      denied: true,
      message: 'No file input is available for media access.',
    };
  }

  try {
    if (options?.accept) {
      inputElement.setAttribute('accept', options.accept);
    }

    if (options?.capture) {
      inputElement.setAttribute('capture', options.capture);
    }

    inputElement.click();

    return {
      supported: true,
      granted: true,
      denied: false,
    };
  } catch {
    return {
      supported: true,
      granted: false,
      denied: true,
      message: 'Unable to open the media picker. Please try again.',
    };
  }
}
