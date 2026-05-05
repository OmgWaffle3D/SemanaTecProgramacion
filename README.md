# SemanaTecProgramacion

## 📋 Descripción del Proyecto

Este proyecto es un juego interactivo de dos jugadores construido con HTML, CSS y JavaScript. El juego incluye una página de inicio, la interfaz del juego principal y una pantalla de resultados finales.

### Páginas del Proyecto

#### 🎮 **Página de Inicio** (`pages/inicio.html`)
Esta es la pantalla de bienvenida del juego donde se muestran:
- Los controles para ambos jugadores
- El objetivo del juego
- Un botón para iniciar la partida

**Controles:**
- **Jugador 1**: W (arriba), A (izquierda), S (abajo), D (derecha)
- **Jugador 2**: Flechas del teclado (↑, ←, ↓, →)

#### 🕹️ **Página Principal del Juego** (`pages/index.html`)
La interfaz principal donde se desarrolla el juego:
- Canvas para renderizar el juego
- Visualización de puntuación en tiempo real
- Overlay de inicio y game over

#### 🏆 **Página Final** (`pages/final.html`)
Pantalla de resultados al terminar el juego:
- Muestra los puntos finales de ambos jugadores
- Indica quién ganó o si hubo empate
- Botón para volver a jugar

---

## 🔧 Guía de Git y Desarrollo Colaborativo

### 1️⃣ Crear una Nueva Rama (Branch)

Para crear una nueva rama y trabajar en una funcionalidad específica:

```bash
# Crear y cambiar a una nueva rama
git checkout -b nombre-de-tu-rama

# Alternativa moderna (Git 2.23+)
git switch -c nombre-de-tu-rama
```

**Convención de nombres recomendada:**
- `feature/nombre-funcionalidad` - Para nuevas características
- `fix/nombre-bug` - Para corregir bugs
- `docs/nombre-documento` - Para documentación

**Ejemplo:**
```bash
git checkout -b feature/agregar-enemigos
```

---

### 2️⃣ Cambiar Entre Ramas

Para cambiar a una rama existente:

```bash
# Cambiar a una rama existente
git checkout nombre-de-rama

# Alternativa moderna
git switch nombre-de-rama
```

**Ver todas las ramas disponibles:**
```bash
# Ramas locales
git branch

# Todas las ramas (incluyendo remotas)
git branch -a
```

---

### 3️⃣ Hacer Commits (Guardar Cambios)

Un commit es un "punto de guardado" con tus cambios:

```bash
# Ver los cambios que has hecho
git status

# Preparar archivos para el commit (staging)
git add nombre-archivo.js

# Preparar todos los cambios
git add .

# Crear un commit con un mensaje descriptivo
git commit -m "Descripción clara de qué cambió"
```

**Ejemplo de buen mensaje de commit:**
```bash
git commit -m "Agregar sistema de colisiones para enemigos"
```

---

### 4️⃣ Push - Enviar tus Cambios al Repositorio

⚠️ **IMPORTANTE**: Nunca hagas push directamente a `main`. Siempre pushea a tu rama de desarrollo.

```bash
# Enviar tu rama al repositorio remoto
git push origin nombre-de-tu-rama

# Primera vez que subes una rama
git push -u origin nombre-de-tu-rama
```

**Ejemplo:**
```bash
git push origin feature/agregar-enemigos
```

---

### 5️⃣ Pull - Obtener Cambios del Repositorio

Para obtener los cambios más recientes del repositorio:

```bash
# Descargar cambios de la rama remota sin fusionar
git fetch origin

# Descargar y fusionar cambios a tu rama local
git pull origin nombre-de-rama
```

**Ejemplo:**
```bash
git pull origin develop
```

---

### 6️⃣ Pull Request (PR) - Fusionar a Develop

Cuando termines de trabajar en tu rama:

1. **Asegúrate de que tu rama esté actualizada:**
   ```bash
   git pull origin develop
   ```

2. **Pushea tu rama:**
   ```bash
   git push origin nombre-de-tu-rama
   ```

3. **En GitHub/GitLab, crea un Pull Request:**
   - Selecciona tu rama como `source`
   - Selecciona `develop` como `target`
   - Agrega una descripción clara de los cambios
   - Espera revisión antes de hacer merge

4. **Después del merge, limpia tu rama local:**
   ```bash
   git checkout develop
   git pull origin develop
   git branch -d nombre-de-tu-rama
   ```

---

### ⚠️ Reglas Importantes

| ✅ HACER | ❌ NO HACER |
|---------|-----------|
| Hacer push a tu rama de feature | Hacer push directo a `main` |
| Crear Pull Request a `develop` | Hacer merge manual a `main` |
| Actualizar tu rama antes de hacer PR | Trabajar en `main` localmente |
| Escribir mensajes de commit claros | Commits con mensajes vagas como "fix" |
| Solicitar revisión en el PR | Hacer merge sin revisión |

---

### 📝 Flujo de Trabajo Completo (Ejemplo)

```bash
# 1. Actualizar tu rama local de develop
git checkout develop
git pull origin develop

# 2. Crear una nueva rama para tu feature
git checkout -b feature/nueva-mecanica

# 3. Hacer cambios y commits
git add .
git commit -m "Implementar nueva mecánica de juego"
git commit -m "Ajustar hitbox de enemigos"

# 4. Subir tu rama
git push origin feature/nueva-mecanica

# 5. En GitHub/GitLab, crear Pull Request
# (Esperar revisión y aprobación)

# 6. Después de merge, actualizar localmente
git checkout develop
git pull origin develop
git branch -d feature/nueva-mecanica
```

---

## 📦 Estructura del Proyecto

```
SemanaTecProgramacion/
├── README.md              # Este archivo
├── pages/
│   ├── inicio.html       # Página de inicio
│   ├── index.html        # Página principal del juego
│   └── final.html        # Página de resultados finales
├── script/
│   └── script.js         # Lógica del juego
└── styles/
    └── style.css         # Estilos del proyecto
```

---

## 🚀 Cómo Empezar

1. Clonar el repositorio
2. Crear tu propia rama: `git checkout -b tu-rama`
3. Hacer cambios
4. Hacer commits y push a tu rama
5. Crear un Pull Request a `develop`
6. Esperar revisión y aprobación

¡Feliz codificación! 🎮
