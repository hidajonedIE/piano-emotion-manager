
import json
from deep_translator import GoogleTranslator

def translate_missing_keys(missing_keys_file, base_lang_file, locales_dir):
    with open(missing_keys_file, 'r') as f:
        missing_keys_data = json.load(f)

    with open(base_lang_file, 'r') as f:
        base_translations = json.load(f)

    for lang, keys in missing_keys_data.items():
        print(f'Translating for {lang}...')
        translator = GoogleTranslator(source='es', target=lang)
        lang_file_path = f'{locales_dir}/{lang}/translations.json'

        with open(lang_file_path, 'r') as f:
            lang_translations = json.load(f)

        for key in keys:
            nested_keys = key.split('.')
            base_value = base_translations
            for nested_key in nested_keys:
                base_value = base_value.get(nested_key, {})

            if isinstance(base_value, str):
                translated_text = translator.translate(base_value)
                
                temp_translations = lang_translations
                for i, nested_key in enumerate(nested_keys):
                    if i == len(nested_keys) - 1:
                        temp_translations[nested_key] = translated_text
                    else:
                        temp_translations = temp_translations.setdefault(nested_key, {})

        with open(lang_file_path, 'w') as f:
            json.dump(lang_translations, f, ensure_ascii=False, indent=2)

        print(f'Finished translating for {lang}.')

if __name__ == '__main__':
    translate_missing_keys(
        '/home/ubuntu/piano-emotion-manager/scripts/missing_keys.json',
        '/home/ubuntu/piano-emotion-manager/locales/es/translations.json',
        '/home/ubuntu/piano-emotion-manager/locales'
    )
