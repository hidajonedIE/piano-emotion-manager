
import pandas as pd
import json
import re

def apply_terminology_corrections():
    """
    Aplica correcciones de coherencia terminológica basadas en el glosario maestro.
    """
    
    # Cargar archivos
    file_path = "/home/ubuntu/piano-emotion-manager/TRADUCCIONES_MEJORADAS_DEEPL.xlsx"
    glossary_path = "/home/ubuntu/piano-emotion-manager/glosario_maestro.json"
    
    df = pd.read_excel(file_path)
    
    with open(glossary_path, "r", encoding="utf-8") as f:
        glossary = json.load(f)
    
    # Mapeo de idiomas
    lang_map = {
        "es": "Español",
        "en": "Inglés",
        "de": "Alemán",
        "fr": "Francés",
        "it": "Italiano",
        "pt": "Portugués",
        "da": "Danés",
        "no": "Noruego",
        "sv": "Sueco"
    }
    
    print("Aplicando correcciones de coherencia terminológica...")
    
    corrections_applied = 0
    
    # Para cada término en el glosario
    for term, term_data in glossary.items():
        translations = term_data["translations"]
        
        # Buscar claves que contienen este término
        pattern = f"\\b{term}\\b"
        matching_indices = df[df["Clave"].str.contains(pattern, case=False, regex=True, na=False)].index
        
        if len(matching_indices) == 0:
            continue
        
        print(f"\nProcesando término: {term}")
        print(f"  Claves encontradas: {len(matching_indices)}")
        
        # Para cada idioma, aplicar la traducción estándar del glosario
        for lang_code, lang_name in lang_map.items():
            if lang_code not in translations:
                continue
            
            standard_translation = translations[lang_code]
            
            # Verificar si hay variaciones y corregirlas
            for idx in matching_indices:
                current_value = df.loc[idx, lang_name]
                
                # Si la traducción actual contiene el término en ese idioma, reemplazarlo
                if pd.notna(current_value):
                    current_str = str(current_value)
                    
                    # Buscar variaciones del término
                    # Por ejemplo, si el término es "invoice", buscar "invoices", "Invoice", etc.
                    term_pattern = f"\\b{term}s?\\b"
                    
                    if re.search(term_pattern, current_str, re.IGNORECASE):
                        # Reemplazar con la traducción estándar
                        # Mantener mayúsculas/minúsculas del original si es necesario
                        if current_str[0].isupper():
                            corrected = standard_translation.capitalize()
                        else:
                            corrected = standard_translation
                        
                        if current_str != corrected:
                            df.loc[idx, lang_name] = corrected
                            corrections_applied += 1
    
    # Guardar archivo corregido
    output_file = "/home/ubuntu/piano-emotion-manager/TRADUCCIONES_CORREGIDAS_PARA_REVISOR.xlsx"
    df.to_excel(output_file, index=False)
    
    print(f"\n✓ Correcciones aplicadas: {corrections_applied}")
    print(f"✓ Archivo guardado: {output_file}")
    
    # Generar reporte de cambios
    report = []
    report.append("# Reporte de Correcciones Aplicadas\n\n")
    report.append(f"**Fecha:** {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
    report.append(f"**Correcciones aplicadas:** {corrections_applied}\n\n")
    report.append("## Términos Corregidos\n\n")
    
    for term in glossary.keys():
        report.append(f"- `{term}`\n")
    
    report.append("\n## Instrucciones para la Empresa de Traducciones\n\n")
    report.append("1. Revisar el archivo XLSX adjunto\n")
    report.append("2. Verificar que las traducciones sean consistentes\n")
    report.append("3. Consultar el Glosario Maestro para términos clave\n")
    report.append("4. Hacer correcciones según sea necesario\n")
    report.append("5. Devolver el archivo con cambios marcados\n\n")
    
    report_file = "/home/ubuntu/piano-emotion-manager/REPORTE_CORRECCIONES_APLICADAS.md"
    with open(report_file, "w", encoding="utf-8") as f:
        f.write("\n".join(report))
    
    print(f"✓ Reporte de cambios: {report_file}")

if __name__ == "__main__":
    apply_terminology_corrections()
