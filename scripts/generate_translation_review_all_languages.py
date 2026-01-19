
import json
import os
from pathlib import Path

def generate_translation_reviews_all_languages():
    locales_dir = Path(__file__).parent.parent / 'locales'
    
    # Get all languages
    all_languages = [d for d in os.listdir(locales_dir) if os.path.isdir(locales_dir / d)]
    
    # Language names
    language_names = {
        'da': 'Danés',
        'de': 'Alemán',
        'en': 'Inglés',
        'es': 'Español',
        'fr': 'Francés',
        'it': 'Italiano',
        'no': 'Noruego',
        'pt': 'Portugués',
        'sv': 'Sueco'
    }
    
    def flatten_dict(d, parent_key='', sep='.'):
        items = []
        for k, v in d.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(flatten_dict(v, new_key, sep=sep).items())
            else:
                items.append((new_key, v))
        return dict(items)
    
    # For each language, create a document
    for base_lang in all_languages:
        print(f'Generating review document for {base_lang}...')
        
        # Load base language translations
        with open(locales_dir / base_lang / 'translations.json', 'r', encoding='utf-8') as f:
            base_translations = json.load(f)
        
        # Get other languages
        other_languages = [lang for lang in all_languages if lang != base_lang]
        
        # Create markdown document
        doc = []
        doc.append(f'# Documento de Revisión de Traducciones - {language_names.get(base_lang, base_lang)}\n')
        doc.append('## Instrucciones para la Empresa de Traducciones\n')
        doc.append(f'Este documento contiene todas las claves de traducción en {language_names.get(base_lang, base_lang)} (idioma base) y sus equivalentes en otros idiomas.')
        doc.append('Por favor, revise cada traducción y corrija cualquier error o inconsistencia.\n')
        
        # Flatten translations
        flat_base = flatten_dict(base_translations)
        
        # Create table
        doc.append(f'| Clave | {language_names.get(base_lang, base_lang)} (Base) | ' + ' | '.join([language_names.get(lang, lang) for lang in sorted(other_languages)]) + ' |')
        doc.append('|' + '|'.join(['---'] * (len(other_languages) + 2)) + '|')
        
        for key in sorted(flat_base.keys()):
            base_value = flat_base[key]
            row = [f'`{key}`', f'`{base_value}`']
            
            for lang in sorted(other_languages):
                lang_file = locales_dir / lang / 'translations.json'
                if lang_file.exists():
                    with open(lang_file, 'r', encoding='utf-8') as f:
                        lang_translations = json.load(f)
                    flat_lang = flatten_dict(lang_translations)
                    value = flat_lang.get(key, '**[FALTA TRADUCCIÓN]**')
                    row.append(f'`{value}`')
                else:
                    row.append('**[ARCHIVO NO ENCONTRADO]**')
            
            doc.append('| ' + ' | '.join(row) + ' |')
        
        # Write to file
        output_file = locales_dir.parent / f'DOCUMENTO_REVISION_TRADUCCIONES_{base_lang.upper()}.md'
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(doc))
        
        print(f'Documento generado: {output_file}')

if __name__ == '__main__':
    generate_translation_reviews_all_languages()
