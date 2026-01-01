# Configuración de Protección de Ramas

## ⚠️ REGLAS ESTRICTAS

### Rama `main` (Producción)
- ❌ **PROHIBIDO**: `git push -f` (push forzado)
- ❌ **PROHIBIDO**: `git reset --hard` seguido de push
- ❌ **PROHIBIDO**: Commits directos
- ✅ **PERMITIDO**: Solo merge desde `develop` vía Pull Request

### Rama `develop` (Desarrollo)
- ❌ **PROHIBIDO**: `git push -f` (push forzado)
- ✅ **PERMITIDO**: Merge desde ramas `feature/*`, `fix/*`, `hotfix/*`
- ✅ **PERMITIDO**: Commits directos solo para cambios menores

### Ramas de Características
- `feature/*` - Nuevas funcionalidades
- `fix/*` - Correcciones de bugs
- `hotfix/*` - Correcciones urgentes
- `refactor/*` - Refactorización
- `test/*` - Tests
- `docs/*` - Documentación
- `experiment/*` - Pruebas experimentales

## 📋 Configuración en GitHub

Para configurar la protección de ramas en GitHub:

1. Ve a: https://github.com/hidajonedIE/piano-emotion-manager/settings/branches
2. Haz clic en "Add rule" o "Add branch protection rule"
3. En "Branch name pattern" escribe: `main`
4. Activa las siguientes opciones:

### Para la rama `main`:
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: 1
  - ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
- ✅ **Require conversation resolution before merging**
- ✅ **Do not allow bypassing the above settings**
- ✅ **Restrict who can push to matching branches**
  - Añadir: Solo administradores (o nadie para máxima protección)

5. Haz clic en "Create" o "Save changes"

6. Repite el proceso para la rama `develop` con configuración similar pero menos restrictiva

## 🔒 Verificación de Protección

Para verificar que la protección está activa:

```bash
# Intentar push forzado (debe fallar)
git push -f origin main
# Resultado esperado: Error - protected branch

# Verificar ramas protegidas
gh api repos/hidajonedIE/piano-emotion-manager/branches/main/protection
```

## 📝 Flujo de Trabajo Correcto

### 1. Crear nueva característica
```bash
git checkout develop
git pull origin develop
git checkout -b feature/nombre-caracteristica
# ... hacer cambios ...
git add .
git commit -m "feat: descripción"
git push origin feature/nombre-caracteristica
```

### 2. Crear Pull Request
- Ve a GitHub
- Crea PR de `feature/nombre-caracteristica` → `develop`
- Espera revisión y aprobación
- Merge a `develop`

### 3. Deploy a producción
```bash
git checkout develop
git pull origin develop
# Crear PR de develop → main en GitHub
# Espera aprobación
# Merge a main
```

## 🚨 En Caso de Emergencia

Si necesitas recuperar un commit:

```bash
# Ver reflog
git reflog

# Recuperar commit específico
git cherry-pick <commit-hash>

# O crear rama desde commit perdido
git checkout -b recovery/<nombre> <commit-hash>
```

## ✅ Checklist de Seguridad

Antes de cada push:
- [ ] Estoy en la rama correcta (no `main`)
- [ ] He hecho `git pull` para actualizar
- [ ] Los tests pasan localmente
- [ ] El commit message es descriptivo
- [ ] No estoy usando `-f` (force)

---

**Última actualización**: 1 de enero de 2026  
**Responsable**: Equipo de desarrollo Piano Emotion Manager
