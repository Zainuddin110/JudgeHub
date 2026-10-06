import en from "../messages/en.json";

export type MessageKey =
  | `common.${keyof typeof en.common}`
  | `auth.${keyof typeof en.auth}`
  | `org.${keyof typeof en.org}`
  | `audit.${keyof typeof en.audit}`;

const dictionaries: Record<string, typeof en> = {
  en,
};

export function t(key: MessageKey, locale: string = "en"): string {
  const dict = dictionaries[locale] || dictionaries.en;
  const [section, prop] = key.split(".") as [keyof typeof en, string];
  const sec = dict[section] as Record<string, string> | undefined;
  if (sec && typeof sec[prop] === "string") {
    return sec[prop];
  }
  return key;
}
