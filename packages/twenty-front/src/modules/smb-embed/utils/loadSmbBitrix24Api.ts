import { isDefined } from 'twenty-shared/utils';

import { SMB_BITRIX24_SDK_URL } from '@/smb-embed/constants/SmbBitrix24SdkUrl';
import { type SmbBitrix24Api } from '@/smb-embed/types/SmbBitrix24Api';

declare global {
  interface Window {
    BX24?: SmbBitrix24Api;
  }
}

let pendingApi: Promise<SmbBitrix24Api> | undefined;

const appendSdkScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    const script = document.createElement('script');

    script.src = SMB_BITRIX24_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Bitrix24 library did not load'));
    document.head.appendChild(script);
  });

// The library is loaded on first use, not with the page: outside a portal it
// has nothing to talk to, and inside one only the fullscreen button needs it.
export const loadSmbBitrix24Api = (): Promise<SmbBitrix24Api> => {
  if (isDefined(pendingApi)) {
    return pendingApi;
  }

  pendingApi = (isDefined(window.BX24) ? Promise.resolve() : appendSdkScript())
    .then(
      () =>
        new Promise<SmbBitrix24Api>((resolve, reject) => {
          const api = window.BX24;

          if (!isDefined(api)) {
            reject(new Error('Bitrix24 library is not available'));

            return;
          }

          api.init(() => resolve(api));
        }),
    )
    .catch((error) => {
      // A failed load must not be remembered, or the button stays dead until reload.
      pendingApi = undefined;
      throw error;
    });

  return pendingApi;
};
