
import pandas as pd
from collections import defaultdict
import re

def detailed_terminology_analysis():
    """
    Análisis exhaustivo de coherencia terminológica.
    Identifica variaciones de traducción para cada término clave.
    """
    
    file_path = "/home/ubuntu/piano-emotion-manager/TRADUCCIONES_MEJORADAS_DEEPL.xlsx"
    df = pd.read_excel(file_path)
    
    languages = ["Danés", "Alemán", "Inglés", "Español", "Francés", "Italiano", "Noruego", "Portugués", "Sueco"]
    
    # Términos clave a analizar
    key_terms_analysis = {
        "invoice": {
            "es": "factura",
            "en": "invoice",
            "de": "Rechnung",
            "fr": "facture",
            "it": "fattura",
            "pt": "fatura",
            "da": "faktura",
            "no": "faktura",
            "sv": "faktura"
        },
        "appointment": {
            "es": "cita",
            "en": "appointment",
            "de": "Termin",
            "fr": "rendez-vous",
            "it": "appuntamento",
            "pt": "agendamento",
            "da": "aftale",
            "no": "avtale",
            "sv": "möte"
        },
        "client": {
            "es": "cliente",
            "en": "client",
            "de": "Kunde",
            "fr": "client",
            "it": "cliente",
            "pt": "cliente",
            "da": "klient",
            "no": "klient",
            "sv": "kund"
        },
        "piano": {
            "es": "piano",
            "en": "piano",
            "de": "Klavier",
            "fr": "piano",
            "it": "pianoforte",
            "pt": "piano",
            "da": "klaver",
            "no": "piano",
            "sv": "piano"
        },
        "tuning": {
            "es": "afinación",
            "en": "tuning",
            "de": "Stimmung",
            "fr": "accord",
            "it": "accordatura",
            "pt": "afinação",
            "da": "stemning",
            "no": "stemming",
            "sv": "stämning"
        },
        "maintenance": {
            "es": "mantenimiento",
            "en": "maintenance",
            "de": "Wartung",
            "fr": "entretien",
            "it": "manutenzione",
            "pt": "manutenção",
            "da": "vedlikehold",
            "no": "vedlikehold",
            "sv": "underhåll"
        }
    }
    
    report = []
    report.append("# Análisis Exhaustivo de Coherencia Terminológica\n\n")
    report.append("## Resumen Ejecutivo\n\n")
    report.append("Este análisis verifica la consistencia de traducción para términos clave en todos los idiomas.\n")
    report.append("Se buscan variaciones en cómo se traducen conceptos específicos de Piano Emotion Manager.\n\n")
    
    # Análisis por término
    total_issues = 0
    
    for term, translations in key_terms_analysis.items():
        report.append(f"## Término: `{term}`\n\n")
        
        # Buscar claves que contienen este término
        pattern = f"\\b{term}\\b"
        matching_rows = df[df["Clave"].str.contains(pattern, case=False, regex=True, na=False)]
        
        if len(matching_rows) == 0:
            report.append("*No se encontraron claves con este término.*\n\n")
            continue
        
        report.append(f"**Claves encontradas:** {len(matching_rows)}\n\n")
        
        # Crear tabla de variaciones
        report.append("| Clave | Español | Inglés | Alemán | Francés | Italiano |\n")
        report.append("|---|---|---|---|---|---|\n")
        
        for idx, row in matching_rows.head(10).iterrows():
            clave = row["Clave"]
            es = row.get("Español", "")
            en = row.get("Inglés", "")
            de = row.get("Alemán", "")
            fr = row.get("Francés", "")
            it = row.get("Italiano", "")
            
            # Truncar si es muy largo
            es = str(es)[:30] + "..." if len(str(es)) > 30 else es
            en = str(en)[:30] + "..." if len(str(en)) > 30 else en
            de = str(de)[:30] + "..." if len(str(de)) > 30 else de
            fr = str(fr)[:30] + "..." if len(str(fr)) > 30 else fr
            it = str(it)[:30] + "..." if len(str(it)) > 30 else it
            
            report.append(f"| {clave} | {es} | {en} | {de} | {fr} | {it} |\n")
        
        if len(matching_rows) > 10:
            report.append(f"| ... | ... | ... | ... | ... | ... |\n")
        
        report.append("\n")
    
    # Análisis de variaciones por idioma
    report.append("## Análisis de Variaciones por Idioma\n\n")
    
    for lang in languages:
        report.append(f"### {lang}\n\n")
        
        # Contar palabras más frecuentes
        all_text = " ".join(df[lang].astype(str).values)
        words = all_text.lower().split()
        word_freq = defaultdict(int)
        
        for word in words:
            # Limpiar puntuación
            word = re.sub(r'[^\w\s]', '', word)
            if len(word) > 4:  # Solo palabras de más de 4 caracteres
                word_freq[word] += 1
        
        # Mostrar palabras más frecuentes
        top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
        report.append("**Palabras más frecuentes:**\n\n")
        for word, freq in top_words:
            report.append(f"- `{word}`: {freq} ocurrencias\n")
        
        report.append("\n")
    
    # Recomendaciones
    report.append("## Recomendaciones\n\n")
    report.append("1. **Crear un Glosario Maestro:** Establecer traducciones estándar para cada término clave.\n")
    report.append("2. **Validación Humana:** Revisar con hablantes nativos de cada idioma.\n")
    report.append("3. **Herramientas CAT:** Usar herramientas de traducción asistida por computadora para mantener consistencia.\n")
    report.append("4. **Pruebas en Aplicación:** Verificar cómo se ven las traducciones en contexto.\n")
    report.append("5. **Documentación:** Mantener un documento de decisiones de traducción.\n\n")
    
    # Guardar reporte
    output_file = "/home/ubuntu/piano-emotion-manager/ANALISIS_DETALLADO_TERMINOLOGIA.md"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(report))
    
    print(f"Análisis detallado de terminología guardado: {output_file}")

if __name__ == "__main__":
    detailed_terminology_analysis()
