
import pandas as pd
from collections import defaultdict
import re

def check_terminology_consistency():
    """
    Verifica la coherencia terminológica en todos los idiomas.
    Identifica términos que se traducen de múltiples formas diferentes.
    """
    
    file_path = "/home/ubuntu/piano-emotion-manager/TRADUCCIONES_MEJORADAS_DEEPL.xlsx"
    df = pd.read_excel(file_path)
    
    # Definir términos clave a verificar (en español)
    key_terms = {
        # Términos de Facturación
        "factura": ["invoice", "Rechnung", "facture", "fattura", "fatura", "faktura", "faktura", "faktura"],
        "número de factura": ["invoice number", "Rechnungsnummer", "numéro de facture", "numero di fattura", "número de fatura", "fakturanummer", "fakturanummer", "fakturanummer"],
        "pago": ["payment", "Zahlung", "paiement", "pagamento", "pagamento", "betaling", "betaling", "betalning"],
        
        # Términos de Servicios
        "afinación": ["tuning", "Stimmung", "accordage", "accordatura", "afinação", "stemming", "stemming", "stämning"],
        "mantenimiento": ["maintenance", "Wartung", "entretien", "manutenzione", "manutenção", "vedlikehold", "vedlikehold", "underhåll"],
        "reparación": ["repair", "Reparatur", "réparation", "riparazione", "reparo", "reparasjon", "reparasjon", "reparation"],
        
        # Términos de Clientes
        "cliente": ["client", "Kunde", "client", "cliente", "cliente", "klient", "klient", "kund"],
        "piano": ["piano", "Klavier", "piano", "pianoforte", "piano", "piano", "piano", "piano"],
        
        # Términos de Citas
        "cita": ["appointment", "Termin", "rendez-vous", "appuntamento", "agendamento", "avtale", "avtale", "möte"],
        "calendario": ["calendar", "Kalender", "calendrier", "calendario", "calendário", "kalender", "kalender", "kalender"],
        
        # Términos de Configuración
        "configuración": ["settings", "Einstellungen", "paramètres", "impostazioni", "configurações", "innstillinger", "innstillinger", "inställningar"],
        "usuario": ["user", "Benutzer", "utilisateur", "utente", "usuário", "bruker", "bruker", "användare"],
        
        # Términos de Negocio
        "empresa": ["company", "Unternehmen", "entreprise", "azienda", "empresa", "bedrift", "bedrift", "företag"],
        "dirección": ["address", "Adresse", "adresse", "indirizzo", "endereço", "adresse", "adresse", "adress"],
    }
    
    # Crear un diccionario para almacenar variaciones de traducción
    terminology_variations = defaultdict(lambda: defaultdict(set))
    
    # Analizar cada fila del dataframe
    for index, row in df.iterrows():
        clave = row["Clave"]
        
        # Buscar términos clave en la clave
        for spanish_term in key_terms.keys():
            if spanish_term.lower() in clave.lower():
                # Registrar todas las traducciones de este término
                for lang in ["Danés", "Alemán", "Inglés", "Español", "Francés", "Italiano", "Noruego", "Portugués", "Sueco"]:
                    if lang in row and pd.notna(row[lang]):
                        terminology_variations[spanish_term][lang].add(str(row[lang]))
    
    # Generar reporte de inconsistencias
    report = []
    report.append("# Reporte de Coherencia Terminológica\n")
    report.append("## Análisis de Términos Clave en Todos los Idiomas\n")
    report.append("Este reporte identifica cómo se traducen los términos clave de Piano Emotion Manager en cada idioma.\n")
    report.append("**Nota:** Si un término tiene múltiples traducciones, indica una posible inconsistencia.\n\n")
    
    inconsistency_count = 0
    
    for spanish_term in sorted(key_terms.keys()):
        if spanish_term not in terminology_variations:
            continue
        
        report.append(f"### Término: `{spanish_term}`\n")
        report.append("| Idioma | Traducciones Encontradas |\n")
        report.append("|---|---|\n")
        
        has_inconsistency = False
        for lang in ["Danés", "Alemán", "Inglés", "Español", "Francés", "Italiano", "Noruego", "Portugués", "Sueco"]:
            variations = terminology_variations[spanish_term].get(lang, set())
            if len(variations) > 1:
                has_inconsistency = True
                inconsistency_count += 1
                report.append(f"| {lang} | ⚠️ **INCONSISTENCIA**: {', '.join(sorted(variations))} |\n")
            elif len(variations) == 1:
                report.append(f"| {lang} | {list(variations)[0]} |\n")
            else:
                report.append(f"| {lang} | *No encontrado* |\n")
        
        report.append("\n")
    
    # Análisis de palabras clave por contexto
    report.append("## Análisis de Palabras Clave por Contexto\n\n")
    
    # Palabras clave técnicas
    technical_keywords = {
        "invoice": ["invoices", "invoice", "factura"],
        "appointment": ["appointments", "appointment", "cita"],
        "piano": ["piano", "pianos"],
        "client": ["client", "clients", "cliente"],
        "tuning": ["tuning", "afinación"],
        "maintenance": ["maintenance", "mantenimiento"],
    }
    
    for keyword, related_terms in technical_keywords.items():
        report.append(f"### Palabra Clave: `{keyword}`\n")
        
        # Buscar todas las claves que contienen esta palabra
        matching_keys = df[df["Clave"].str.contains(keyword, case=False, na=False)]
        
        if len(matching_keys) > 0:
            report.append(f"**Encontradas {len(matching_keys)} claves relacionadas**\n\n")
            
            # Mostrar variaciones de traducción
            for lang in ["Inglés", "Español", "Alemán", "Francés"]:
                if lang in matching_keys.columns:
                    translations = matching_keys[lang].unique()
                    if len(translations) > 1:
                        report.append(f"- **{lang}:** {', '.join(str(t) for t in translations[:3])}{'...' if len(translations) > 3 else ''}\n")
        
        report.append("\n")
    
    # Guardar reporte
    output_file = "/home/ubuntu/piano-emotion-manager/REPORTE_COHERENCIA_TERMINOLOGICA.md"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(report))
    
    print(f"Reporte de coherencia terminológica generado: {output_file}")
    print(f"Inconsistencias encontradas: {inconsistency_count}")
    
    return terminology_variations

if __name__ == "__main__":
    check_terminology_consistency()
