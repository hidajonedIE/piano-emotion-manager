# Guía de Comandos Git Seguros

## 🚨 COMANDOS PROHIBIDOS

### ❌ NUNCA usar estos comandos en `main` o `develop`:

```bash
# PROHIBIDO: Push forzado
git push -f
git push --force
git push --force-with-lease

# PROHIBIDO: Reset seguido de push
git reset --hard <commit>
git push -f

# PROHIBIDO: Reescribir historial público
git rebase -i <commit>  # en ramas públicas
git commit --amend      # en commits ya pusheados
git filter-branch
```

---

## ✅ COMANDOS SEGUROS

### 1. Flujo de Trabajo Diario

#### Actualizar tu rama local
```bash
git checkout develop
git pull origin develop
```

#### Crear nueva característica
```bash
git checkout -b feature/nombre-descriptivo
```

#### Hacer cambios y commitear
```bash
git add .
git commit -m "tipo(alcance): descripción corta"
```

#### Subir cambios
```bash
git push origin feature/nombre-descriptivo
```

---

### 2. Tipos de Commits (Conventional Commits)

```bash
# Nueva funcionalidad
git commit -m "feat(auth): añadir login con Google"

# Corrección de bug
git commit -m "fix(api): corregir error 500 en endpoint de usuarios"

# Refactorización
git commit -m "refactor(db): optimizar queries de clientes"

# Documentación
git commit -m "docs(readme): actualizar instrucciones de instalación"

# Tests
git commit -m "test(auth): añadir tests para login"

# Performance
git commit -m "perf(dashboard): reducir re-renders con React.memo"

# Chore (tareas)
git commit -m "chore(deps): actualizar dependencias"

# Style (formato)
git commit -m "style(components): formatear código con prettier"
```

---

### 3. Trabajar con Ramas

#### Ver todas las ramas
```bash
git branch -a
```

#### Cambiar de rama
```bash
git checkout nombre-rama
```

#### Crear y cambiar a nueva rama
```bash
git checkout -b feature/nueva-caracteristica
```

#### Eliminar rama local (después de merge)
```bash
git branch -d feature/caracteristica-completada
```

#### Eliminar rama remota
```bash
git push origin --delete feature/caracteristica-completada
```

---

### 4. Actualizar tu Rama con Cambios de `develop`

#### Opción 1: Merge (RECOMENDADO)
```bash
git checkout feature/mi-caracteristica
git merge develop
# Resolver conflictos si hay
git add .
git commit -m "merge: actualizar desde develop"
git push
```

#### Opción 2: Rebase (solo en ramas privadas)
```bash
git checkout feature/mi-caracteristica
git rebase develop
# Resolver conflictos si hay
git add .
git rebase --continue
git push -f origin feature/mi-caracteristica  # OK en rama privada
```

---

### 5. Deshacer Cambios (SIN perder historial)

#### Deshacer cambios no commiteados
```bash
# Deshacer cambios en archivo específico
git checkout -- archivo.txt

# Deshacer todos los cambios no commiteados
git reset --hard HEAD
```

#### Deshacer último commit (mantener cambios)
```bash
git reset --soft HEAD~1
```

#### Deshacer último commit (eliminar cambios)
```bash
git reset --hard HEAD~1
```

#### Revertir un commit (crear nuevo commit que deshace)
```bash
git revert <commit-hash>
```

---

### 6. Ver Historial

#### Ver commits recientes
```bash
git log --oneline -10
```

#### Ver historial gráfico
```bash
git log --oneline --graph --all
```

#### Ver cambios de un commit
```bash
git show <commit-hash>
```

#### Ver quién modificó cada línea
```bash
git blame archivo.txt
```

---

### 7. Stash (Guardar cambios temporalmente)

#### Guardar cambios sin commitear
```bash
git stash
```

#### Ver stashes guardados
```bash
git stash list
```

#### Recuperar último stash
```bash
git stash pop
```

#### Recuperar stash específico
```bash
git stash apply stash@{0}
```

---

### 8. Tags (Versiones)

#### Crear tag anotado
```bash
git tag -a v1.0.0 -m "Versión 1.0.0 - Descripción"
```

#### Subir tag a GitHub
```bash
git push origin v1.0.0
```

#### Subir todos los tags
```bash
git push origin --tags
```

#### Ver todos los tags
```bash
git tag -l
```

#### Eliminar tag local
```bash
git tag -d v1.0.0
```

#### Eliminar tag remoto
```bash
git push origin --delete v1.0.0
```

---

### 9. Recuperación de Emergencia

#### Ver reflog (historial de cambios de HEAD)
```bash
git reflog
```

#### Recuperar commit "perdido"
```bash
git cherry-pick <commit-hash>
```

#### Crear rama desde commit específico
```bash
git checkout -b recovery/nombre <commit-hash>
```

#### Recuperar desde backup
```bash
/home/ubuntu/recover-from-backup.sh /home/ubuntu/backups/piano-emotion-manager/latest.bundle
```

---

### 10. Limpieza

#### Eliminar ramas locales ya mergeadas
```bash
git branch --merged | grep -v "\*" | grep -v "main" | grep -v "develop" | xargs -n 1 git branch -d
```

#### Limpiar referencias remotas eliminadas
```bash
git fetch --prune
```

#### Limpiar archivos no trackeados
```bash
git clean -fd
```

---

## 🔍 Verificación Antes de Push

### Checklist:
```bash
# 1. Ver qué archivos cambiarán
git status

# 2. Ver los cambios específicos
git diff

# 3. Ver los commits que se subirán
git log origin/develop..HEAD --oneline

# 4. Verificar que estás en la rama correcta
git branch

# 5. Si todo está bien, push
git push origin nombre-de-tu-rama
```

---

## 🆘 Ayuda Rápida

### ¿Cometiste un error?

1. **NO ENTRES EN PÁNICO**
2. **NO HAGAS `git push -f`**
3. Consulta el reflog: `git reflog`
4. Busca el commit antes del error
5. Crea una rama de recuperación: `git checkout -b recovery/<nombre> <commit-hash>`
6. Pide ayuda si es necesario

### ¿Necesitas recuperar algo?

```bash
# Ver todos los commits (incluso "perdidos")
git reflog

# Recuperar commit específico
git cherry-pick <commit-hash>

# Recuperar desde backup
/home/ubuntu/recover-from-backup.sh
```

---

## 📚 Recursos

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

**Última actualización**: 1 de enero de 2026  
**Mantenido por**: Equipo Piano Emotion Manager
