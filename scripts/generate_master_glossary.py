
import pandas as pd
import json
from collections import defaultdict

def generate_master_glossary():
    """
    Genera un glosario maestro con traducciones estándar para términos clave.
    """
    
    file_path = "/home/ubuntu/piano-emotion-manager/TRADUCCIONES_MEJORADAS_DEEPL.xlsx"
    df = pd.read_excel(file_path)
    
    languages = ["Danés", "Alemán", "Inglés", "Español", "Francés", "Italiano", "Noruego", "Portugués", "Sueco"]
    
    # Definir términos clave con sus traducciones recomendadas
    master_glossary = {
        "invoice": {
            "category": "Facturación",
            "context": "Documento de facturación",
            "translations": {
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
            "notes": "Término técnico-legal. Debe ser consistente en todos los contextos."
        },
        "appointment": {
            "category": "Citas y Calendario",
            "context": "Cita de servicio programada",
            "translations": {
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
            "notes": "Preferir 'cita' sobre 'servicio' para claridad."
        },
        "client": {
            "category": "Gestión de Clientes",
            "context": "Propietario del piano / usuario del servicio",
            "translations": {
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
            "notes": "No confundir con 'usuario' (que es más genérico)."
        },
        "piano": {
            "category": "Instrumentos",
            "context": "Instrumento musical principal",
            "translations": {
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
            "notes": "Término universal. Mantener consistencia."
        },
        "tuning": {
            "category": "Servicios",
            "context": "Servicio de afinación del piano",
            "translations": {
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
            "notes": "Término técnico especializado. Crítico para el negocio."
        },
        "maintenance": {
            "category": "Servicios",
            "context": "Servicio de mantenimiento general",
            "translations": {
                "es": "mantenimiento",
                "en": "maintenance",
                "de": "Wartung",
                "fr": "entretien",
                "it": "manutenzione",
                "pt": "manutenção",
                "da": "vedlikehold",
                "no": "vedlikehold",
                "sv": "underhåll"
            },
            "notes": "Diferente de 'reparación'. Mantenimiento preventivo."
        },
        "repair": {
            "category": "Servicios",
            "context": "Servicio de reparación",
            "translations": {
                "es": "reparación",
                "en": "repair",
                "de": "Reparatur",
                "fr": "réparation",
                "it": "riparazione",
                "pt": "reparo",
                "da": "reparation",
                "no": "reparasjon",
                "sv": "reparation"
            },
            "notes": "Diferente de 'mantenimiento'. Reparación correctiva."
        },
        "calendar": {
            "category": "Interfaz",
            "context": "Calendario de citas",
            "translations": {
                "es": "calendario",
                "en": "calendar",
                "de": "Kalender",
                "fr": "calendrier",
                "it": "calendario",
                "pt": "calendário",
                "da": "kalender",
                "no": "kalender",
                "sv": "kalender"
            },
            "notes": "Término de interfaz. Debe ser claro y consistente."
        },
        "settings": {
            "category": "Interfaz",
            "context": "Configuración de la aplicación",
            "translations": {
                "es": "configuración",
                "en": "settings",
                "de": "Einstellungen",
                "fr": "paramètres",
                "it": "impostazioni",
                "pt": "configurações",
                "da": "indstillinger",
                "no": "innstillinger",
                "sv": "inställningar"
            },
            "notes": "Término de interfaz estándar."
        },
        "user": {
            "category": "Gestión de Usuarios",
            "context": "Usuario del sistema",
            "translations": {
                "es": "usuario",
                "en": "user",
                "de": "Benutzer",
                "fr": "utilisateur",
                "it": "utente",
                "pt": "usuário",
                "da": "bruger",
                "no": "bruker",
                "sv": "användare"
            },
            "notes": "Diferente de 'cliente'. Usuario = técnico/administrador."
        },
        "payment": {
            "category": "Facturación",
            "context": "Pago de factura",
            "translations": {
                "es": "pago",
                "en": "payment",
                "de": "Zahlung",
                "fr": "paiement",
                "it": "pagamento",
                "pt": "pagamento",
                "da": "betaling",
                "no": "betaling",
                "sv": "betalning"
            },
            "notes": "Término financiero. Debe ser consistente."
        }
    }
    
    # Generar reporte en Markdown
    report = []
    report.append("# Glosario Maestro de Términos Clave\n\n")
    report.append("## Introducción\n\n")
    report.append("Este glosario define las traducciones estándar para términos clave de Piano Emotion Manager.\n")
    report.append("Debe ser utilizado como referencia para mantener consistencia terminológica en todas las traducciones.\n\n")
    
    # Por categoría
    categories = defaultdict(list)
    for term, data in master_glossary.items():
        categories[data["category"]].append((term, data))
    
    for category in sorted(categories.keys()):
        report.append(f"## {category}\n\n")
        
        for term, data in categories[category]:
            report.append(f"### `{term}`\n\n")
            report.append(f"**Contexto:** {data['context']}\n\n")
            report.append("**Traducciones:**\n\n")
            report.append("| Idioma | Traducción |\n")
            report.append("|---|---|\n")
            
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
            
            for lang_code, lang_name in sorted(lang_map.items()):
                translation = data["translations"].get(lang_code, "N/A")
                report.append(f"| {lang_name} | `{translation}` |\n")
            
            report.append(f"\n**Notas:** {data['notes']}\n\n")
    
    # Generar archivo JSON para uso en aplicación
    json_glossary = {}
    for term, data in master_glossary.items():
        json_glossary[term] = {
            "category": data["category"],
            "context": data["context"],
            "translations": data["translations"],
            "notes": data["notes"]
        }
    
    # Guardar archivos
    md_file = "/home/ubuntu/piano-emotion-manager/GLOSARIO_MAESTRO_TERMINOS.md"
    json_file = "/home/ubuntu/piano-emotion-manager/glosario_maestro.json"
    
    with open(md_file, "w", encoding="utf-8") as f:
        f.write("\n".join(report))
    
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(json_glossary, f, ensure_ascii=False, indent=2)
    
    print(f"Glosario maestro generado:")
    print(f"  - Markdown: {md_file}")
    print(f"  - JSON: {json_file}")
    print(f"  - Términos definidos: {len(master_glossary)}")

if __name__ == "__main__":
    generate_master_glossary()
