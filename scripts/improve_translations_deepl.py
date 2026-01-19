
import pandas as pd
import deepl
import os

def improve_translations_with_deepl():
    # Get API key from environment
    api_key = os.getenv("DEEPL_API_KEY")
    
    if not api_key:
        print("Error: DEEPL_API_KEY no está configurada en las variables de entorno.")
        print("Por favor, configura la variable de entorno DEEPL_API_KEY con tu clave de API de DeepL.")
        return
    
    # Initialize DeepL translator
    translator = deepl.Translator(api_key)
    
    # Load original translations
    file_path = "/home/ubuntu/piano-emotion-manager/TRADUCCIONES_CONSOLIDADAS.xlsx"
    df = pd.read_excel(file_path)
    
    # Language mapping for DeepL
    language_map = {
        "Danés": "DA",
        "Alemán": "DE",
        "Inglés": "EN-US",
        "Español": "ES",
        "Francés": "FR",
        "Italiano": "IT",
        "Noruego": "NO",
        "Portugués": "PT-PT",
        "Sueco": "SV"
    }
    
    # For each row, translate from Spanish (base language) to other languages
    print("Iniciando mejora de traducciones con DeepL...")
    
    improved_count = 0
    error_count = 0
    
    for index, row in df.iterrows():
        spanish_text = row["Español"]
        
        if pd.isnull(spanish_text) or spanish_text == "":
            continue
        
        # For each target language
        for lang_name, lang_code in language_map.items():
            if lang_name == "Español":
                continue
            
            try:
                # Translate from Spanish to target language
                result = translator.translate_text(spanish_text, target_language=lang_code)
                improved_translation = result.text
                
                # Update the dataframe
                df.loc[index, lang_name] = improved_translation
                improved_count += 1
                
                # Print progress every 50 translations
                if improved_count % 50 == 0:
                    print(f"Progreso: {improved_count} traducciones mejoradas...")
                    
            except Exception as e:
                print(f"Error al traducir '{row['Clave']}' a {lang_name}: {str(e)}")
                error_count += 1
    
    # Save improved translations
    output_file = "/home/ubuntu/piano-emotion-manager/TRADUCCIONES_MEJORADAS_DEEPL.xlsx"
    df.to_excel(output_file, index=False)
    
    print(f"\nMejora de traducciones completada!")
    print(f"Traducciones mejoradas: {improved_count}")
    print(f"Errores: {error_count}")
    print(f"Archivo guardado: {output_file}")

if __name__ == "__main__":
    improve_translations_with_deepl()
