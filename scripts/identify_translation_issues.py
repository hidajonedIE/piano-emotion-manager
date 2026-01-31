
import pandas as pd

def identify_translation_issues():
    file_path = "/home/ubuntu/piano-emotion-manager/TRADUCCIONES_CONSOLIDADAS.xlsx"
    df = pd.read_excel(file_path)
    
    issues = []

    # 1. Missing translations
    missing = df[df.isnull().any(axis=1)]
    for index, row in missing.iterrows():
        for lang in df.columns[1:]:
            if pd.isnull(row[lang]):
                issues.append({
                    "Clave": row["Clave"],
                    "Idioma": lang,
                    "Problema": "Traducción faltante",
                    "Valor Original": "",
                    "Sugerencia": f"Traducir ",
                })

    # 2. Inconsistent translations
    def check_consistency(term_es, term_en):
        inconsistent = df[(df["Español"].str.contains(term_es, na=False)) & (~df["Inglés"].str.contains(term_en, na=False))]
        for index, row in inconsistent.iterrows():
            issues.append({
                "Clave": row["Clave"],
                "Idioma": "Inglés",
                "Problema": f"Inconsistencia en la traducción de ",
                "Valor Original": row["Inglés"],
                "Sugerencia": f"Usar ",
            })

    check_consistency("factura", "invoice")
    check_consistency("cliente", "client")
    check_consistency("piano", "piano")

    # 3. Placeholder issues
    placeholders = df[df.apply(lambda row: row.astype(str).str.contains(r"{{\w+}}").any(), axis=1)]
    for index, row in placeholders.iterrows():
        for lang in df.columns[1:]:
            if isinstance(row[lang], str) and "[[" in row[lang]:
                issues.append({
                    "Clave": row["Clave"],
                    "Idioma": lang,
                    "Problema": "Placeholder sin traducir",
                    "Valor Original": row[lang],
                    "Sugerencia": "Traducir el contenido del placeholder",
                })

    # 4. Length issues (example: translation is much longer/shorter than original)
    for index, row in df.iterrows():
        es_len = len(str(row["Español"]))
        for lang in df.columns[1:]:
            lang_len = len(str(row[lang]))
            if es_len > 0 and (lang_len > es_len * 2 or lang_len < es_len / 2):
                issues.append({
                    "Clave": row["Clave"],
                    "Idioma": lang,
                    "Problema": "Longitud de la traducción sospechosa",
                    "Valor Original": row[lang],
                    "Sugerencia": "Revisar si la traducción es demasiado larga o corta",
                })

    # Save issues to a new Excel file
    issues_df = pd.DataFrame(issues)
    issues_df.to_excel("/home/ubuntu/piano-emotion-manager/TRADUCCIONES_ERRORES.xlsx", index=False)
    print(f"Se encontraron {len(issues)} problemas de traducción. El informe se ha guardado en TRADUCCIONES_ERRORES.xlsx")

if __name__ == "__main__":
    identify_translation_issues()
