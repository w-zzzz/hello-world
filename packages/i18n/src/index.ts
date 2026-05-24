export async function getMessages(locale: 'zh' | 'en') {
  return (await import(`./messages/${locale}/common.json`)).default;
}

export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];
