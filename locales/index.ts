import es from './es/translations.json';
import pt from './pt/translations.json';
import it from './it/translations.json';
import fr from './fr/translations.json';
import de from './de/translations.json';
import da from './da/translations.json';
import en from './en/translations.json';

export const translations = {
  es,
  pt,
  it,
  fr,
  de,
  da,
  en,
};

export type SupportedLanguage = 'es' | 'pt' | 'it' | 'fr' | 'de' | 'da' | 'en';

export const supportedLanguages: { code: SupportedLanguage; name: string; nativeName: string; flag: string }[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
];

export const defaultLanguage: SupportedLanguage = 'es';

export default translations;
