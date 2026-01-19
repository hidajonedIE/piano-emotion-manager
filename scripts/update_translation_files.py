
import pandas as pd
import json
import os

def update_translation_files():
    """
    Actualiza los archivos de traducción en el repositorio con las correcciones.
    """
    
    # Cargar el archivo corregido
    corrected_file = "/home/ubuntu/piano-emotion-manager/TRADUCCIONES_CORREGIDAS_PARA_REVISOR.xlsx"
    df = pd.read_excel(corrected_file)
    
    # Mapeo de idiomas a códigos
    lang_map = {
        "Español": "es",
        "Inglés": "en",
        "Alemán": "de",
        "Francés": "fr",
        "Italiano": "it",
        "Portugués": "pt",
        "Danés": "da",
        "Noruego": "no",
        "Sueco": "sv"
    }
    
    locales_dir = "/home/ubuntu/piano-emotion-manager/locales"
    
    print("Actualizando archivos de traducción en el repositorio...")
    
    # Para cada idioma, actualizar el archivo JSON
    for lang_name, lang_code in lang_map.items():
        print(f"\nProcesando {lang_name} ({lang_code})...")
        
        # Crear diccionario de traducciones
        translations = {}
        
        for idx, row in df.iterrows():
            clave = row["Clave"]
            valor = row[lang_name]
            
            if pd.notna(valor) and valor != "":
                translations[clave] = str(valor)
        
        # Guardar en archivo JSON
        file_path = os.path.join(locales_dir, f"{lang_code}.json")
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(translations, f, ensure_ascii=False, indent=2)
        
        print(f"  ✓ {len(translations)} traducciones guardadas en {file_path}")
    
    print("\n✓ Todos los archivos de traducción han sido actualizados")
    
    # Generar reporte
    report = []
    report.append("# Reporte de Actualización de Archivos de Traducción\n\n")
    report.append(f"**Fecha:** {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
    report.append("## Archivos Actualizados\n\n")
    
    for lang_name, lang_code in lang_map.items():
        file_path = os.path.join(locales_dir, f"{lang_code}.json")
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            report.append(f"- `{lang_code}.json` ({file_size} bytes) - {lang_name}\n")
    
    report.append("\n## Próximos Pasos\n\n")
    report.append("1. Hacer commit de los cambios\n")
    report.append("2. Hacer push al repositorio\n")
    report.append("3. Desplegar en Vercel\n")
    
    report_file = "/home/ubuntu/piano-emotion-manager/REPORTE_ACTUALIZACION_ARCHIVOS.md"
    with open(report_file, "w", encoding="utf-8") as f:
        f.write("\n".join(report))
    
    print(f"\n✓ Reporte: {report_file}")

if __name__ == "__main__":
    update_translation_files()
