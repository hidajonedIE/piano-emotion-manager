
import pandas as pd

def generate_change_report():
    original_file = "/home/ubuntu/piano-emotion-manager/TRADUCCIONES_CONSOLIDADAS.xlsx"
    corrected_file = "/home/ubuntu/piano-emotion-manager/TRADUCCIONES_CORREGIDAS.xlsx"
    
    df_original = pd.read_excel(original_file)
    df_corrected = pd.read_excel(corrected_file)
    
    # Set Clave as index
    df_original.set_index("Clave", inplace=True)
    df_corrected.set_index("Clave", inplace=True)
    
    # Find differences
    changes = []
    for index, row in df_corrected.iterrows():
        for col in df_corrected.columns:
            if row[col] != df_original.loc[index, col]:
                changes.append({
                    "Clave": index,
                    "Idioma": col,
                    "Valor Original": df_original.loc[index, col],
                    "Valor Corregido": row[col]
                })
    
    # Save report to markdown file
    report = []
    report.append("# Reporte de Cambios en Traducciones\n")
    report.append("Este documento detalla todos los cambios realizados en el archivo de traducciones.\n")
    report.append("| Clave | Idioma | Valor Original | Valor Corregido |")
    report.append("|---|---|---|---|")
    
    for change in changes:
        report.append(f"| `{change['Clave']}` | {change['Idioma']} | `{change['Valor Original']}` | `{change['Valor Corregido']}` |")
        
    with open("/home/ubuntu/piano-emotion-manager/REPORTE_CAMBIOS_TRADUCCIONES.md", "w", encoding="utf-8") as f:
        f.write("\n".join(report))
        
    print("Reporte de cambios generado: REPORTE_CAMBIOS_TRADUCCIONES.md")

if __name__ == "__main__":
    generate_change_report()
