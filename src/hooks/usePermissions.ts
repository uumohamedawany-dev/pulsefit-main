import { useCallback, useState } from 'react';
import {
  checkBiometricAvailability,
  checkStorageAvailability,
  requestMediaPicker,
  type PermissionState,
} from '@/lib/permissions';

export function usePermissions() {
  const [storageState, setStorageState] = useState<PermissionState>(() => checkStorageAvailability());
  const [biometricState, setBiometricState] = useState<PermissionState>({
    supported: false,
    granted: false,
    denied: true,
    message: 'Biometric availability has not been checked yet.',
  });

  const refreshStorageState = useCallback(() => {
    const nextState = checkStorageAvailability();
    setStorageState(nextState);
    return nextState;
  }, []);

  const requestBiometricPermission = useCallback(async () => {
    const nextState = await checkBiometricAvailability();
    setBiometricState(nextState);
    return nextState;
  }, []);

  const requestMediaPermission = useCallback(
    (inputElement: HTMLInputElement | null, options?: { accept?: string; capture?: 'user' | 'environment' }) => {
      const nextState = requestMediaPicker(inputElement, options);
      return nextState;
    },
    []
  );

  const showPermissionAlert = useCallback((message?: string) => {
    if (typeof window !== 'undefined' && typeof window.alert === 'function' && message) {
      window.alert(message);
    }
  }, []);

  return {
    storageState,
    biometricState,
    refreshStorageState,
    requestBiometricPermission,
    requestMediaPermission,
    showPermissionAlert,
  };
}
