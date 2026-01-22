import re

# Leer el archivo
with open('server/services/team/work-assignment.service.ts', 'r') as f:
    content = f.read()

# Encontrar todas las funciones async y agregar const db = await getDb(); al inicio
# Patrón para encontrar funciones async
pattern = r'(async\s+\w+\([^)]*\):\s*Promise<[^>]+>\s*\{)'

def add_db_declaration(match):
    func_start = match.group(1)
    return func_start + '\n    const db = await getDb();'

# Aplicar el reemplazo
content_fixed = re.sub(pattern, add_db_declaration, content)

# Escribir el archivo
with open('server/services/team/work-assignment.service.ts', 'w') as f:
    f.write(content_fixed)

print("Correcciones aplicadas")
