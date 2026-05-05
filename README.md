# Space Shooter - SemanaTecProgramacion

## 📋 Descripción del Proyecto

**Space Shooter** es un juego arcade interactivo de un jugador construido con **HTML5, CSS y JavaScript vanilla**. El juego cuenta con mecánicas de puntuación, dificultad progresiva y una interfaz moderna con efectos glassmorphism.

### Objetivo del Juego
- 🎮 Destruir enemigos y acumular puntos
- 📈 La dificultad aumenta conforme subes de puntuación
- 🎯 Evitar que Diddy te atrape para mantener vivo el juego

---

## 📁 Estructura del Proyecto

```
SemanaTecProgramacion/
│
├── 📄 README.md                   # Este archivo (documentación del proyecto)
├── 📄 index.html                  # Página principal del JUEGO ⭐
│
├── 📁 pages/
│   ├── inicio.html               # Página de INICIO (controles e instrucciones)
│   ├── final.html                # Página de GAME OVER (resultados)
│   └── index.html                # (Archivo antiguo - NO USAR)
│
├── 📁 styles/
│   └── style.css                 # Estilos CSS del proyecto (colores, layout, glassmorphism)
│
└── 📁 script/
    └── script.js                 # Lógica del juego (física, colisiones, puntuación)
```

---

## 📄 Descripción de Archivos

### **Flujo de Navegación**
```
pages/inicio.html → index.html (juego) → pages/final.html
```

### 🎮 **Archivos HTML**

#### `pages/inicio.html` (Página de Inicio)
- **Propósito:** Pantalla de bienvenida y explicación de controles
- **Contiene:**
  - Título del juego
  - Descripción del objetivo
  - Controles para Jugador 1 y Jugador 2
  - Botón "COMENZAR JUEGO" → redirige a `index.html?start=true`
- **Path de estilos:** `../styles/style.css`

#### `index.html` (Juego Principal) ⭐
- **Propósito:** Interfaz principal del juego
- **Contiene:**
  - Header con título y contador de puntos
  - Canvas (`<canvas>`) para renderizar el juego
  - Overlay de Game Over
- **Path de estilos:** `styles/style.css`
- **Path de script:** `script/script.js`
- **Auto-inicio:** Si viene con parámetro `?start=true`, inicia automáticamente

#### `pages/final.html` (Pantalla de Game Over)
- **Propósito:** Mostrar resultados finales
- **Contiene:**
  - Mensaje "¡GAME OVER!"
  - Puntuación final conseguida
  - Botón "VOLVER A JUGAR" → regresa a `pages/inicio.html`
- **Obtiene puntuación de:** `localStorage.finalScore` o parámetro URL
- **Path de estilos:** `../styles/style.css`

---

### 🎨 **Archivo CSS**

#### `styles/style.css`
- **Propósito:** Define todos los estilos visuales del proyecto
- **Contiene:**
  - **Variables CSS:**
    - Colores: `--bg-primary`, `--accent-color`, `--ball-color`
    - Efectos: `--glass-bg`, `--glass-border`
    - Tipografía: `--text-primary`, `--text-secondary`
  - **Componentes:**
    - `.game-container` - Contenedor principal con glassmorphism
    - `.overlay` - Pantallas superpuestas (inicio, game over)
    - `.btn-primary` - Botón principal
    - `.score-badge` - Mostrador de puntuación
    - Canvas styling - Efectos visuales del juego
  - **Características visuales:**
    - Gradientes de fondo con efectos blur
    - Efecto glassmorphism (cristal)
    - Animaciones suave en botones
    - Responsive layout con flexbox

---

### ⚙️ **Archivo JavaScript**

#### `script/script.js`
- **Propósito:** Contiene toda la lógica del juego
- **Funciones principales:**
  - **Navegación:**
    - `irAFinal(score)` - Navega a `pages/final.html` guardando puntuación
    - `irAInicio()` - Vuelve a `pages/inicio.html`
  - **Lógica del juego:**
    - `initGame()` - Inicializa el juego
    - `update()` - Actualiza posiciones y detecta colisiones
    - `draw()` - Dibuja elementos en el canvas
    - `gameLoop()` - Loop de animación (requestAnimationFrame)
  - **Gestión de eventos:**
    - Movimiento del mouse (catcher)
    - Click en botones (inicio, reinicio)
    - Auto-inicio si viene de `pages/inicio.html`
  - **Variables de estado:**
    - `state` - Controla si el juego está activo y puntuación
    - `ball` - Posición, velocidad y radio de la pelota
    - `catcher` - Posición y tamaño del atrapador
    - `CONFIG` - Configuración (velocidad, colores, etc.)

---

## 🔄 Flujo de la Aplicación

```
1. Usuario accede a pages/inicio.html
   ↓
2. Lee controles e instrucciones
   ↓
3. Hace click en "COMENZAR JUEGO"
   ↓
4. Se redirige a index.html?start=true
   ↓
5. Script.js detecta parámetro ?start=true
   ↓
6. Juego inicia automáticamente
   ↓
7. Usuario juega y acumula puntos
   ↓
8. Pelota cae (game over)
   ↓
9. Script.js llama a irAFinal(score)
   ↓
10. Se redirige a pages/final.html con la puntuación
    ↓
11. Usuario ve resultados y click en "VOLVER A JUGAR"
    ↓
12. Regresa a pages/inicio.html (vuelta al paso 1)
```

---

## 🎨 Diseño Visual

- **Tema:** Oscuro futurista (Dark mode)
- **Colores principales:**
  - Fondo: `#0a0a0c` (Gris muy oscuro)
  - Acento: `#00f2ff` (Cyan brillante)
  - Pelota: `#ff2d55` (Rojo/Rosa)
- **Efecto visual:** Glassmorphism (cristal translúcido con blur)
- **Tipografía:** Google Font "Outfit" (moderna y geométrica)

---

## 🚀 Cómo Usar

### Iniciar el Juego Localmente

1. **Con Live Server (recomendado):**
   ```bash
   # Instalar Live Server en VS Code
   # Clic derecho en pages/inicio.html → Open with Live Server
   ```
   O navega a: `http://127.0.0.1:5500/pages/inicio.html`

2. **Con Python:**
   ```bash
   python -m http.server 8000
   # Luego abre: http://localhost:8000/pages/inicio.html
   ```

3. **Sin servidor:**
   - Solo abre `pages/inicio.html` directamente en el navegador (funciona, pero sin algunos features)

---

## 📝 Notas de Desarrollo

- ✅ Todo el código está en **vanilla JavaScript** (sin librerías externas)
- ✅ Usa **Canvas API** para renderizar el juego
- ✅ Aplica **patrones de estado** para manejar el game state
- ✅ Los paths son **relativos** para funcionar en cualquier ubicación
- ✅ Responsive con **Flexbox**

---

## 🔧 Guía de Git y Desarrollo Colaborativo

### 1️⃣ Crear una Nueva Rama (Branch)

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

```bash
git checkout nombre-de-rama
# O
git switch nombre-de-rama
```

**Ver todas las ramas:**
```bash
git branch -a
```

---

### 3️⃣ Hacer Commits

```bash
# Ver cambios
git status

# Preparar archivos (staging)
git add nombre-archivo.js
git add .  # Todos los cambios

# Crear commit
git commit -m "Descripción clara de qué cambió"
```

**Ejemplo:**
```bash
git commit -m "Aumentar espaciado de texto en overlay"
```

---

### 4️⃣ Push - Enviar Cambios

```bash
git push origin nombre-de-tu-rama

# Primera vez (establece tracking)
git push -u origin nombre-de-tu-rama
```

⚠️ **NUNCA** hagas push a `main` directamente.

---

### 5️⃣ Pull Request (PR)

1. Push tu rama
2. En GitHub, crea PR desde tu rama hacia `dev`
3. Espera revisión
4. Merge después de aprobación

---

### ⚠️ Reglas Importantes

| ✅ HACER | ❌ NO HACER |
|---------|-----------|
| Hacer push a tu rama | Push directo a `main` |
| Crear PR antes de merge | Merge sin revisión |
| Mensajes descriptivos | Commits vagas como "fix" |
| Actualizar rama antes de PR | Trabajo directo en `main` |

---

### 👥 Roles Asignados


---

## ¡Feliz Codificación! 🎮

¿Preguntas o sugerencias? Crea un issue o abre una discusión en el repositorio.
