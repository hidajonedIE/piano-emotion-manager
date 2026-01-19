
import pandas as pd

def review_translations():
    file_path = "/home/ubuntu/piano-emotion-manager/TRADUCCIONES_CONSOLIDADAS.xlsx"
    df = pd.read_excel(file_path)
    
    # Example of a simple check: find missing translations
    missing_translations = df[df.isnull().any(axis=1)]
    if not missing_translations.empty:
        print("Claves con traducciones faltantes:")
        print(missing_translations)
    
    # Example of a consistency check: ensure certain terms are translated consistently
    def check_consistency(term_es, term_en):
        inconsistent = df[(df["Español"].str.contains(term_es, na=False)) & (~df["Inglés"].str.contains(term_en, na=False))]
        if not inconsistent.empty:
            print(f"\nInconsistencias encontradas para el término ", term_es, "/")
            print(inconsistent[["Clave", "Español", "Inglés"]])

    check_consistency("factura", "invoice")
    check_consistency("cliente", "client")
    check_consistency("piano", "piano")

    # More checks can be added here...

if __name__ == "__main__":
    review_translations()
