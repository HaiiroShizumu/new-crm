import Cookies from 'js-cookie';

import { getSmbEmbeddedCookieAttributes } from '@/smb-embed/utils/getSmbEmbeddedCookieAttributes';
import { isSmbEmbedded } from '@/smb-embed/utils/isSmbEmbedded';

class CookieStorage {
  private keys: Set<string> = new Set();

  getItem(key: string): string | undefined {
    return Cookies.get(key);
  }

  setItem(
    key: string,
    value: string,
    attributes?: Cookies.CookieAttributes,
  ): void {
    this.keys.add(key);

    const secureAttributes = {
      secure: window.location.protocol === 'https:',
      sameSite: 'lax' as const,
      ...getSmbEmbeddedCookieAttributes(isSmbEmbedded()),
      ...attributes,
    };

    Cookies.set(key, value, secureAttributes);
  }

  removeItem(key: string, attributes?: Cookies.CookieAttributes): void {
    this.keys.delete(key);
    Cookies.remove(key, attributes);
  }

  clear(): void {
    this.keys.forEach((key) => this.removeItem(key));
  }
}

export const cookieStorage = new CookieStorage();
