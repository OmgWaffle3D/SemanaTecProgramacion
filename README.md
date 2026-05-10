# Space Shooter - SemanaTecProgramacion

## 📋 Descripción del Proyecto

**Space Shooter** es un juego arcade interactivo construido con **HTML5, CSS y JavaScript vanilla**. El juego cuenta con mecánicas de puntuación, dificultad progresiva, modo multijugador (1-2 jugadores), sistema de items especiales y una interfaz retro futurista con efectos visuales modernos.

### Objetivo del Juego
- 🎮 Destruir enemigos y acumular puntos
- 📈 La dificultad aumenta conforme subes de puntuación
- 👥 Juega solo o desafía a un amigo en modo 2 jugadores
- 🎁 Recoge items especiales (disparo doble, escudo, recuperación de vida)
- 🏆 Compite por los mejores puntajes en el sistema de highscores

---

## 📁 Estructura del Proyecto

```
SemanaTecProgramacion/
│
├── 📄 README.md                   # Este archivo (documentación del proyecto)
├── 📄 index.html                  # Página principal del JUEGO ⭐
│
├── 📁 pages/
│   ├── inicio.html               # Página de INICIO (selección de modo y color)
│   ├── final.html                # Página de GAME OVER (resultados y highscores)
│   └── index.html                # (Archivo antiguo - NO USAR)
│
├── 📁 styles/
│   └── retro.css                 # Estilos CSS (tema retro futurista)
│
└── 📁 script/
    ├── script.js                 # Lógica principal del juego
    ├── items.js                  # Sistema de items especiales
    └── ui.js                     # Navegación y control de UI
```

---

## 📄 Descripción de Archivos

### **Flujo de Navegación**
```
pages/inicio.html → index.html (juego) → pages/final.html
```

### 🎮 **Archivos HTML**

#### `pages/inicio.html` (Página de Inicio)
- **Propósito:** Pantalla de bienvenida con opciones de juego
- **Contiene:**
  - Título del juego
  - **Selector de modo:** 1 PLAYER o 2 PLAYERS
  - **Selector de color de nave:** Aqua, Magenta o Gold
  - **Botón "CÓMO JUGAR":** Muestra instrucciones y controles
  - Botón "COMENZAR JUEGO" → redirige a `index.html?start=true&players=X&shipColor=Y`
- **Path de estilos:** `../styles/retro.css`

#### `index.html` (Juego Principal) ⭐
- **Propósito:** Interfaz principal del juego
- **Contiene:**
  - Scoreboards (1 o 2 jugadores según el modo)
  - Canvas (`<canvas>`) para renderizar el juego
  - Contador de regresiva (countdown) antes de comenzar
  - Reproductor de YouTube oculto (audio de fondo)
- **Path de estilos:** `styles/retro.css`
- **Scripts:** `script/script.js`, `script/items.js`, `script/ui.js`
- **Parámetros URL:** `?start=true&players=X&shipColor=Y`

#### `pages/final.html` (Pantalla de Game Over)
- **Propósito:** Mostrar resultados finales y highscores
- **Contiene:**
  - Mensaje de "¡VICTORIA!" o "¡GAME OVER!"
  - **Modo 1 jugador:** Puntuación final
  - **Modo 2 jugadores:** Puntuaciones de ambos y ganador
  - **Sistema de Highscores:** Top 10 de mejores puntajes
  - Botón "VOLVER A JUGAR" → regresa a `pages/inicio.html`
- **Obtiene datos de:** `localStorage`
- **Path de estilos:** `../styles/retro.css`

---

### 🎨 **Archivo CSS**

#### `styles/retro.css`
- **Propósito:** Define todos los estilos visuales del proyecto
- **Tema:** Retro futurista (arcade vintage con colores neon)
- **Contiene:**
  - **Variables CSS:**
    - Colores neon: cyan, magenta, gold
    - Fuentes retro: "Press Start 2P" para efecto arcade
  - **Componentes:**
    - `.retro-body` - Estilos base del cuerpo
    - `.game-container` - Contenedor principal del juego
    - `.scoreboard` - Mostrador de puntuación
    - `.score-item` - Items en el ranking de highscores
    - Elementos interactivos con efectos retro
  - **Características visuales:**
    - Fuente pixelada estilo arcade
    - Efectos de sombra/glow neon
    - Colores vibrantes (cyan #3cf4ff, magenta #ff2df4, gold #f4d166)
    - Animaciones suaves en botones
    - Responsive layout

---

### ⚙️ **Archivos JavaScript**

#### `script/script.js` (Lógica Principal del Juego)
- **Propósito:** Contiene la lógica central del juego
- **Funciones principales:**
  - **Inicialización:** `initGame()` - Configura el juego según parámetros
  - **Game Loop:** `update()` y `draw()` - Actualiza posiciones y renderiza
  - **Física:** Movimiento de enemigos, colisiones, disparo
  - **Gestión de eventos:** Teclado y mouse para controlar el jugador
  - **Estado:** Variables globales para jugadores, enemigos, puntuación

#### `script/items.js` (Sistema de Items)
- **Propósito:** Gestiona items especiales que caen tras destruir enemigos
- **Items disponibles:**
  - **DOUBLE_SHOT** 🟣 - Disparo doble por 10 segundos
  - **SHIELD** 🟦 - Escudo que protege de 1 impacto
  - **RECOVERY** 🔴 - Recupera 1 vida (máximo 5)
- **Funciones:**
  - `dropItem(x, y)` - 15% de probabilidad de soltar un item
  - `collectItem(item)` - Aplica el efecto del item recolectado

#### `script/ui.js` (Navegación e Interfaz)
- **Propósito:** Gestiona la navegación y los modales de UI
- **Características:**
  - **Página de inicio:** Selector de modo (1/2 jugadores) y color de nave
  - **Modales:** "Cómo jugar" y "Seleccionar color"
  - **Página final:** Muestra resultado, puntuaciones y highscores
  - **YouTube API:** Reproduce música de fondo automáticamente
  - **LocalStorage:** Guarda highscores y resultados

---

## 🔄 Flujo de la Aplicación

```
1. Usuario accede a pages/inicio.html
   ↓
2. Selecciona modo de juego (1 o 2 jugadores)
   ↓
3. Elige color de nave (aqua, magenta, gold)
   ↓
4. Lee instrucciones en modal "Cómo jugar"
   ↓
5. Hace click en "COMENZAR JUEGO"
   ↓
6. Se redirige a index.html?start=true&players=X&shipColor=Y
   ↓
7. Juego inicia con countdown de 3 segundos
   ↓
8. Jugador controla nave y destruye enemigos
   ↓
9. Recolecta items especiales que aumentan su poder
   ↓
10. Puntuación aumenta, dificultad se incrementa
    ↓
11. Juego termina (victoria/derrota)
    ↓
12. Se redirige a pages/final.html
    ↓
13. Se muestran resultados y ranking de highscores
    ↓
14. Usuario hace click en "VOLVER A JUGAR"
    ↓
15. Regresa a pages/inicio.html (vuelta al paso 1)
```

---

## 🎨 Diseño Visual

- **Tema:** Arcade retro futurista (Vintage + Neon)
- **Colores principales:**
  - Fondo: `#0a0a0c` o gradientes oscuros (tema dark)
  - Primario: `#3cf4ff` (Cyan neon)
  - Secundario: `#ffeb3b` (Gold)
  - Acento: `#ff2df4` (Magenta)
- **Tipografía:** "Press Start 2P" (fuente pixel arcade)
- **Efectos visuales:** 
  - Glow/Shadow neon en elementos principales
  - Animaciones retro
  - Contraste alto para efecto arcade clásico

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

3. **Con Node.js (http-server):**
   ```bash
   npx http-server
   # Luego abre: http://127.0.0.1:8080/pages/inicio.html
   ```

### Instrucciones del Juego

- **Modo 1 Jugador:**
  - Usa el **mouse** para controlar tu nave
  - **Click izquierdo** para disparar
  - Destruye enemigos y recoge items
  - Acumula la máxima puntuación

- **Modo 2 Jugadores:**
  - **Jugador 1:** Ratón para mover, Click para disparar
  - **Jugador 2:** Controles en pantalla (según instrucciones)
  - El jugador con mayor puntuación gana

---

## 📝 Notas de Desarrollo

- ✅ Todo el código está en **vanilla JavaScript** (sin librerías externas)
- ✅ Usa **Canvas API** para renderizar el juego
- ✅ Usa **YouTube API** para reproductor de música de fondo
- ✅ Implementa **localStorage** para highscores y persistencia
- ✅ Aplica **patrones de estado** para manejar el game state
- ✅ Los paths son **relativos** para funcionar en cualquier ubicación
- ✅ Responsive con **Flexbox**
- ✅ Soporte para **modo multijugador**
- ✅ **Sistema modular:** Scripts separados por funcionalidad (items, UI, juego)

---

## 🎁 Sistema de Items Especiales

Cuando destruyes enemigos, hay un **15% de probabilidad** de que caiga un item especial:

| Item | Color | Efecto | Duración |
|------|-------|--------|----------|
| **DOUBLE_SHOT** | 🟣 Magenta | Disparo doble simultáneo | 10 segundos |
| **SHIELD** | 🟦 Cyan | Escudo contra 1 impacto | Hasta usarse |
| **RECOVERY** | 🔴 Rojo | +1 vida (máx 5) | Permanente |

---

## 🏆 Sistema de Highscores

- Se guardan automáticamente en **localStorage**
- Muestra el **Top 10** de mejores puntajes
- Se actualiza después de cada partida
- Persiste entre sesiones del navegador

---

## 🎮 Características Principales

✨ **Modo Multijugador:** Juega solo o con un amigo  
🌈 **Selección de Color:** Personaliza tu nave (Aqua, Magenta, Gold)  
📊 **Sistema de Puntuación:** Ranking global de highscores  
🎵 **Música de Fondo:** Reproducción automática con YouTube API  
🎁 **Power-ups:** Items especiales que cambian el juego  
📈 **Dificultad Progresiva:** Aumenta conforme subes de puntuación  
🎨 **Diseño Retro:** Estética arcade clásica con colores neon  

---

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
