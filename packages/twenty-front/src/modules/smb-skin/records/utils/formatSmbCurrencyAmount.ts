import { type I18n } from '@lingui/core';
import { isNumber, isString } from '@sniptt/guards';

import { convertCurrencyMicrosToCurrencyAmount } from '~/utils/convertCurrencyToCurrencyMicros';

type FormatSmbCurrencyAmountArgs = {
  i18n: I18n;
  amountMicros: unknown;
  currencyCode: unknown;
};

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

export const formatSmbCurrencyAmount = ({
  i18n,
  amountMicros,
  currencyCode,
}: FormatSmbCurrencyAmountArgs): string | null => {
  if (!isNumber(amountMicros)) {
    return null;
  }

  const amount = convertCurrencyMicrosToCurrencyAmount(amountMicros);

  if (!isString(currencyCode) || !CURRENCY_CODE_PATTERN.test(currencyCode)) {
    return i18n.number(amount, { maximumFractionDigits: 0 });
  }

  try {
    return i18n.number(amount, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    });
  } catch {
    // Codes Intl does not know (custom currencies) fall back to a plain number
    return `${i18n.number(amount, { maximumFractionDigits: 0 })} ${currencyCode}`;
  }
};
