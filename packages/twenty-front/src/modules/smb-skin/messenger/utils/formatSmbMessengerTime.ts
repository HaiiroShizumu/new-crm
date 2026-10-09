import { type I18n } from '@lingui/core';

export const formatSmbMessengerTime = (i18n: I18n, createdAt: string) => {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const isToday = date.toDateString() === new Date().toDateString();

  return isToday
    ? i18n.date(date, { hour: '2-digit', minute: '2-digit' })
    : i18n.date(date, { day: 'numeric', month: 'short' });
};
