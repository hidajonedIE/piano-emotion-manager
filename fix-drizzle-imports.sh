#!/bin/bash

# Script para reemplazar @/drizzle con rutas relativas

# Para archivos en server/services/ (1 nivel de profundidad)
find server/services -maxdepth 1 -name "*.ts" -exec sed -i "s|from '@/drizzle/|from '../../drizzle/|g" {} \;

# Para archivos en server/services/calendar/
find server/services/calendar -name "*.ts" -exec sed -i "s|from '@/drizzle/|from '../../../drizzle/|g" {} \;

# Para archivos en server/services/crm/
find server/services/crm -name "*.ts" -exec sed -i "s|from '@/drizzle/|from '../../../drizzle/|g" {} \;

# Para archivos en server/services/distributor/
find server/services/distributor -name "*.ts" -exec sed -i "s|from '@/drizzle/|from '../../../drizzle/|g" {} \;

# Para archivos en server/services/inventory/
find server/services/inventory -name "*.ts" -exec sed -i "s|from '@/drizzle/|from '../../../drizzle/|g" {} \;

# Para archivos en server/services/reports/
find server/services/reports -name "*.ts" -exec sed -i "s|from '@/drizzle/|from '../../../drizzle/|g" {} \;

# Para archivos en hooks/ (1 nivel)
find hooks -maxdepth 1 -name "*.ts" -exec sed -i "s|from '@/drizzle/|from '../drizzle/|g" {} \;

# Para archivos en hooks/inventory/
find hooks/inventory -name "*.ts" -exec sed -i "s|from '@/drizzle/|from '../../drizzle/|g" {} \;

# Para archivos en app/(app)/
find app/\(app\) -name "*.tsx" -exec sed -i "s|from '@/drizzle/|from '../../../drizzle/|g" {} \;

# Para archivos en components/
find components -name "*.tsx" -exec sed -i "s|from '@/drizzle/|from '../../drizzle/|g" {} \;

echo "Reemplazo completado. Verificando..."
grep -r "from '@/drizzle" --include="*.ts" --include="*.tsx" | wc -l
