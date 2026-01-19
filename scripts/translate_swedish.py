
import json
from deep_translator import GoogleTranslator

def translate_swedish():
    base_lang_file = '/home/ubuntu/piano-emotion-manager/locales/es/translations.json'
    sv_file = '/home/ubuntu/piano-emotion-manager/locales/sv/translations.json'

    with open(base_lang_file, 'r', encoding='utf-8') as f:
        base_translations = json.load(f)

    with open(sv_file, 'r', encoding='utf-8') as f:
        sv_translations = json.load(f)

    translator = GoogleTranslator(source='es', target='sv')

    def flatten_dict(d, parent_key='', sep='.'):
        items = []
        for k, v in d.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(flatten_dict(v, new_key, sep=sep).items())
            else:
                items.append((new_key, v))
        return dict(items)

    def unflatten_dict(d, sep='.'):
        result = {}
        for key, value in d.items():
            parts = key.split(sep)
            current = result
            for part in parts[:-1]:
                if part not in current:
                    current[part] = {}
                current = current[part]
            current[parts[-1]] = value
        return result

    flat_base = flatten_dict(base_translations)
    flat_sv = flatten_dict(sv_translations)

    for key, value in flat_base.items():
        if key not in flat_sv:
            print(f'Translating {key}...')
            translated_text = translator.translate(value)
            flat_sv[key] = translated_text

    sv_translations = unflatten_dict(flat_sv)

    with open(sv_file, 'w', encoding='utf-8') as f:
        json.dump(sv_translations, f, ensure_ascii=False, indent=2)

    print('Swedish translation completed.')

if __name__ == '__main__':
    translate_swedish()
