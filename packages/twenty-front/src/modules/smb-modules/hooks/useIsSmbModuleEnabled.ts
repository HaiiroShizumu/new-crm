import { useEnabledSmbModules } from '@/smb-modules/hooks/useEnabledSmbModules';

export const useIsSmbModuleEnabled = (moduleKey: string): boolean => {
  const enabledModules = useEnabledSmbModules();

  return enabledModules.some((manifest) => manifest.key === moduleKey);
};
