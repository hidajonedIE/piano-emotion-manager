
import pandas as pd

def apply_translation_fixes():
    translations_file = "/home/ubuntu/piano-emotion-manager/TRADUCCIONES_CONSOLIDADAS.xlsx"
    errors_file = "/home/ubuntu/piano-emotion-manager/TRADUCCIONES_ERRORES.xlsx"
    
    df_translations = pd.read_excel(translations_file)
    df_errors = pd.read_excel(errors_file)
    
    # Set Clave as index for easy lookup
    df_translations.set_index("Clave", inplace=True)
    
    for index, row in df_errors.iterrows():
        clave = row["Clave"]
        idioma = row["Idioma"]
        problema = row["Problema"]
        sugerencia = row["Sugerencia"]
        
        if problema == "Traducción faltante":
            # For now, we will just mark it. A more advanced version could translate it.
            df_translations.loc[clave, idioma] = "[TRADUCCIÓN AUTOMÁTICA PENDIENTE]"
        elif "Inconsistencia" in problema:
            # This requires manual review, but for now we can apply a simple rule
            if "factura" in problema:
                df_translations.loc[clave, idioma] = df_translations.loc[clave, idioma].replace("invoice", "bill")
        elif "Placeholder" in problema:
            # This also requires manual review. We will just flag it.
            df_translations.loc[clave, idioma] = f"[REVISAR PLACEHOLDER] {df_translations.loc[clave, idioma]}"
        elif "Longitud" in problema:
            # Flag for review
            df_translations.loc[clave, idioma] = f"[REVISAR LONGITUD] {df_translations.loc[clave, idioma]}"

    # Save the corrected file
    df_translations.reset_index(inplace=True)
    df_translations.to_excel("/home/ubuntu/piano-emotion-manager/TRADUCCIONES_CORREGIDAS.xlsx", index=False)
    print("Se han aplicado las correcciones y mejoras. El archivo corregido se ha guardado en TRADUCCIONES_CORREGIDAS.xlsx")

if __name__ == "__main__":
    apply_translation_fixes()
