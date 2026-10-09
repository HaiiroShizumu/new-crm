import { i18n } from '@lingui/core';

import { formatSmbCurrencyAmount } from '@/smb-skin/records/utils/formatSmbCurrencyAmount';

describe('formatSmbCurrencyAmount', () => {
  it('formats micros as a whole currency amount', () => {
    expect(
      formatSmbCurrencyAmount({
        i18n,
        amountMicros: 1_250_000_000,
        currencyCode: 'USD',
      }),
    ).toBe('$1,250');
  });

  it('falls back to a plain number without a valid currency code', () => {
    expect(
      formatSmbCurrencyAmount({
        i18n,
        amountMicros: 3_000_000,
        currencyCode: '',
      }),
    ).toBe('3');
  });

  it('returns null when the amount is missing', () => {
    expect(
      formatSmbCurrencyAmount({
        i18n,
        amountMicros: null,
        currencyCode: 'USD',
      }),
    ).toBeNull();
  });
});
