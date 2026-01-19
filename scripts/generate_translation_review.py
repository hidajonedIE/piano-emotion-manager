
import json
import os
from pathlib import Path

def generate_translation_review():
    locales_dir = Path(__file__).parent.parent / 'locales'
    base_lang = 'es'
    
    # Load base translations
    with open(locales_dir / base_lang / 'translations.json', 'r', encoding='utf-8') as f:
        base_translations = json.load(f)
    
    # Get all languages
    languages = [d for d in os.listdir(locales_dir) if os.path.isdir(locales_dir / d)]
    languages.remove(base_lang)
    
    # Language names
    language_names = {
        'da': 'Danés',
        'de': 'Alemán',
        'en': 'Inglés',
        'fr': 'Francés',
        'it': 'Italiano',
        'pt': 'Portugués',
        'no': 'Noruego',
        'sv': 'Sueco'
    }
    
    # Create markdown document
    doc = []
    doc.append('# Documento de Revisión de Traducciones - Piano Emotion Manager\n')
    doc.append('## Instrucciones para la Empresa de Traducciones\n')
    doc.append('Este documento contiene todas las claves de traducción y sus valores en cada idioma.')
    doc.append('Por favor, revise cada traducción y corrija cualquier error o inconsistencia.\n')
    
    # Flatten translations
    def flatten_dict(d, parent_key='', sep='.'):
        items = []
        for k, v in d.items():
            new_key = f"{parent_key}{sep}{k}" if parent_key else k
            if isinstance(v, dict):
                items.extend(flatten_dict(v, new_key, sep=sep).items())
            else:
                items.append((new_key, v))
        return dict(items)
    
    flat_base = flatten_dict(base_translations)
    
    # Create table
    doc.append('| Clave | Español (Base) | ' + ' | '.join([language_names.get(lang, lang) for lang in sorted(languages)]) + ' |')
    doc.append('|' + '|'.join(['---'] * (len(languages) + 2)) + '|')
    
    for key in sorted(flat_base.keys()):
        base_value = flat_base[key]
        row = [f'`{key}`', f'`{base_value}`']
        
        for lang in sorted(languages):
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
    output_file = locales_dir.parent / 'DOCUMENTO_REVISION_TRADUCCIONES.md'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(doc))
    
    print(f'Documento de revisión generado: {output_file}')

if __name__ == '__main__':
    generate_translation_review()
