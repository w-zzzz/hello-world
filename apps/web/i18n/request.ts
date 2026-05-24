import { getRequestConfig } from 'next-intl/server';
import { getMessages, locales, type Locale } from '@quant-academy/i18n';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (
    locales.includes(requested as Locale) ? requested : routing.defaultLocale
  ) as Locale;

  const messages = await getMessages(locale);

  return {
    locale,
    messages,
  };
});
