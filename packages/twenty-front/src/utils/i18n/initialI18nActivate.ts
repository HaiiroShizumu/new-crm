import { fromStorage, fromUrl } from '@lingui/detect-locale';
import { APP_LOCALES } from 'twenty-shared/translations';
import { isDefined, isValidLocale, normalizeLocale } from 'twenty-shared/utils';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

export const initialI18nActivate = () => {
  const urlLocale = fromUrl('locale');
  const storageLocale = fromStorage('locale');

  // U-6: язык по умолчанию — русский. Язык браузера намеренно не читаем
  // (решение старого билда): продукт по умолчанию русскоязычный; выбор
  // пользователя всё равно приходит из URL (?locale=) или localStorage, а после
  // входа локаль берётся из настроек участника (workspaceMember.locale).
  let locale: keyof typeof APP_LOCALES = APP_LOCALES['ru-RU'];

  const normalizedUrlLocale = isDefined(urlLocale)
    ? normalizeLocale(urlLocale)
    : null;
  const normalizedStorageLocale = isDefined(storageLocale)
    ? normalizeLocale(storageLocale)
    : null;

  if (isDefined(normalizedUrlLocale) && isValidLocale(normalizedUrlLocale)) {
    locale = normalizedUrlLocale;
    try {
      localStorage.setItem('locale', normalizedUrlLocale);
    } catch (error) {
      // oxlint-disable-next-line no-console
      console.log('Failed to save locale to localStorage:', error);
    }
  } else if (
    isDefined(normalizedStorageLocale) &&
    isValidLocale(normalizedStorageLocale)
  ) {
    locale = normalizedStorageLocale;
  }

  dynamicActivate(locale);
};
