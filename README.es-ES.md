

<h1 align="center">Quillon – Etiquétalo. Encuéntralo. Listo.</h1>

<p align="center">
<img width="1920" height="1080" src="https://github.com/user-attachments/assets/3a5bf2dd-803b-4400-a0fa-936b6434021e"/>
</p>

<p align="center">
<strong>Quillon</strong> es una aplicación moderna, ligera e intuitiva para tomar notas, construida con
<strong>Vite, React y TypeScript</strong>. Diseñada para velocidad y eficiencia, utiliza
<strong>RAG Inteligente</strong>, <strong>Comandos</strong> y <strong>Etiquetas Inteligentes</strong> para
<strong>capturar, gestionar y estructurar tus notas sin esfuerzo</strong>.
</p>

<p align="center">
<strong>
<a href="https://quillon.netlify.app/">Demo en Vivo</a> |
<a href="https://github.com/alexcj10/Quillon">Dar estrella en GitHub</a>
</strong>
</p>

<p align="center">
<strong>Escanea el código QR para abrir la aplicación</strong><br><br>
<img src="https://github.com/user-attachments/assets/8bc29b88-d5fc-411c-afc2-7eca587eb05a" width="100"/>
</p>

---

## Características que hacen destacar a Quillon  

### Pownin AI (Smart RAG 2.0)
El corazón de Quillon es **Pownin**, una IA avanzada impulsada por una tubería de recuperación de 5 etapas:
1. **Expansión de Consulta**: Expande automáticamente consultas desordenadas (ej. "mtg w/ sarah") en términos de búsqueda estrictos ("meeting", "Sarah").
2. **Reclasificación Oracle**: Lee tus notas como un humano para encontrar contenido relevante incluso en archivos "Sin título" o desordenados.
3. **Encadenamiento de Contexto**: Crea un "Grafo de Conocimiento" dinámico siguiendo los enlaces entre notas.
4. **Francotirador de Palabras Clave**: Impulsa instantáneamente las coincidencias exactas de Título para una recuperación precisa.
5. **Núcleo de Reflexión**: La IA se autocorrige y reescribe las respuestas si no son perfectas.

### Comando Pownin AI (`@pai-`)
Accede al poder de la IA directamente desde tu flujo de trabajo:
- **En el Editor de Notas**: Escribe `@pai-[consulta]` y presiona **Enter**. La IA inserta una respuesta concisa en **texto plano** directamente en tu nota (perfecta para listas y datos rápidos).
- **En la Barra de Búsqueda**: Escribe `@pai-[consulta]` y presiona **Enter**. Aparece una ventana emergente elegante con una respuesta en **markdown enriquecido**, que incluye detalles profundos y formato de código correcto.


### Sistema de Etiquetado Inteligente
Olvídate de los códigos de color manuales. Quillon organiza las etiquetas automáticamente:
- **Etiquetas Azules (Carpetas)**: Las etiquetas que comienzan con **`file`** (ej. `fileProject`) crean una carpeta principal llamada **Project**.  
 > _Sensible a mayúsculas y minúsculas: `project` y `Project` se tratan como carpetas diferentes._
- **Etiquetas Verdes (Contexto)**: Las etiquetas que viven dentro de una Carpeta Azul se convierten automáticamente en "Etiquetas de Contexto".
- **Etiquetas Grises**: Etiquetas estándar para categorización general.
*No se necesitan comandos. Solo etiquétalo y Quillon lo ordena.*

### Etiquetas Naranja (Etiquetas de Grupo)
Organiza tus etiquetas grises en grupos con nombre para mantener tu espacio de trabajo limpio:
- **Crear Grupo**: Escribe `@orange-[nombre]/create` (ej. `@orange-Trabajo/create`) en la barra de búsqueda de **Todas las Etiquetas**.
- **Comportamiento del Grupo**: Las etiquetas grises agregadas a un Grupo Naranja se **ocultan** de la lista principal, reduciendo el desorden.
- **Entrar al Grupo**: Haz clic en el botón del Grupo Naranja o escribe `@orange-[nombre]/etots`.
- **Gestionar Grupo**:
  - `/drop`: Muestra las etiquetas grises disponibles para agregar al grupo.
  - `/view`: Muestra las etiquetas actualmente en el grupo.
  - `/remove`: Selecciona etiquetas para eliminarlas del grupo (vuelven a la lista principal).
  - `/back`: Vuelve a la vista principal de etiquetas.
- **Renombrar Grupo**: Escribe `@orange-[antiguo]/edit-[nuevo]` (ej. `@orange-Trabajo/edit-Oficina`).
- **Fijar Grupo**: Escribe `@orange-[nombre]/pin` para fijar el grupo y acceder rápido.
- **Favoritar Grupo**: Escribe `@orange-[nombre]/star` (o `/fav`) para marcar el grupo como favorito.
- **Vistazo Rápido**: **Haz clic derecho** (Escritorio) o **mantén presionado** (Móvil) sobre una Etiqueta Naranja para ver e interactuar con las etiquetas internas sin entrar al grupo.
- **Eliminar Grupo**: Escribe `@orange-[nombre]/delete` para eliminar el grupo (las etiquetas internas se liberan, no se eliminan).

### Datos y Almacenamiento
- **Primero Local**: Todas las notas y documentos se almacenan localmente en tu dispositivo usando **IndexedDB** (almacenamiento en disco respaldado por el navegador).
- **Capacidad**: Quillon no impone límites artificiales. La capacidad de almacenamiento escala con el espacio disponible en el dispositivo y las cuotas gestionadas por el navegador, lo que la hace efectivamente ilimitada para uso personal.
- **Privacidad**: Sin servidores en la nube. Tus datos nunca salen de tu dispositivo.

### Comando de Documentación (`@docs`)
Accede rápidamente a la ventana emergente de documentación directamente desde la barra de búsqueda.

#### Uso
- **Comando**: Escribe `@docs` en la barra de búsqueda y presiona **Enter**
- **Acción**: Abre la ventana emergente de documentación instantáneamente.

### Gestión Avanzada de Etiquetas
Edición, eliminación y organización poderosa de etiquetas a través del botón **Todas las Etiquetas** o el ícono **+más**:
- **Acceso**: Haz clic en el botón "Todas las Etiquetas" o en "+X más" cuando tengas muchas etiquetas
- **Editar Nombres de Etiquetas**:
  - Escribe `@` para ver las opciones de tipo de etiqueta (azul/verde/gris)
  - Selecciona el tipo de etiqueta y luego haz clic en cualquier etiqueta para autocompletar
  - Agrega `/edit-[nombreNuevo]` para renombrar: `@blue-nombreAntiguo/edit-nombreNuevo`
  - Presiona Enter para confirmar
- **Fijar/Favoritar Etiquetas**:
  - Escribe `@[tipo]-[nombreEtiqueta]/pin` para fijar etiquetas importantes en la parte superior
  - Escribe `@[tipo]-[nombreEtiqueta]/star` o `@[tipo]-[nombreEtiqueta]/fav` para marcar etiquetas como favoritas
  - Presiona Enter para confirmar
- **Vista de Espacio**:
  - Escribe `@space` para entrar a tu espacio dedicado de **Fijadas y Favoritas**
  - Escribe `@space-return` para salir y volver a la lista completa de etiquetas
- **Eliminar Etiquetas**:
  - Escribe `@[tipo]-[nombreEtiqueta]/delete` (ej. `@grey-trabajo/delete`)
  - En la **Vista Principal**: Elimina la etiqueta y mueve todas las notas asociadas a la papelera
  - En la **Vista de Papelera**: Elimina permanentemente la etiqueta y todas las notas asociadas
  - Presiona Enter para confirmar
- **Validación Inteligente**: Retroalimentación en tiempo real sobre la validez del comando y la disponibilidad de la etiqueta

### Nodos – Gestión Rápida de Tareas
**Nodos** es el sistema de gestión de tareas integrado de Quillon para capturar tareas pendientes y recordatorios rápidos:
- **Acceso vía Búsqueda**: Escribe `@nodes` en la barra de búsqueda (funciona en espacios públicos y privados) para abrir el widget de Nodos
- **Creación Rápida de Nodos**:
  - `@nodes-Reunión con Sam mañana` – Crea un nodo **público**
  - `7@nodes-Reunión con John` – Crea un nodo **privado**
- **Comportamiento Inteligente**:
  - **Nodo público** (`@nodes-[tarea]`) enviado mientras estás en **espacio público** → Se abre la ventana emergente
  - **Nodo público** (`@nodes-[tarea]`) enviado mientras estás en **espacio privado** → Se guarda en público (sin ventana emergente)
  - **Nodo privado** (`7@nodes-[tarea]`) enviado mientras estás en **espacio privado** → Se abre la ventana emergente
  - **Nodo privado** (`7@nodes-[tarea]`) enviado mientras estás en **espacio público** → Se guarda en privado (sin ventana emergente)
- **Características**:
  - Fija nodos importantes para mantenerlos en la parte superior
  - Arrastra y suelta para reordenar tareas
  - Marca nodos como completados
  - Secciones separadas para nodos fijados, activos y completados
- **Validación Inteligente**: Retroalimentación en tiempo real sobre la validez del comando

### Calculadora Inteligente
Realiza cálculos simbólicos instantáneos en cualquier parte de Quillon:
- **Barra de Búsqueda**: Escribe `@c-expresión` para resultados instantáneos. El resultado se copia automáticamente en tu portapapeles.
- **Editor de Notas**: Escribe `@c-expresión` y presiona **Enter** para reemplazar el comando con el resultado.
- **Resolución Simbólica**: Maneja todo, desde aritmética básica (`@c-25*4`) hasta funciones avanzadas (`@c-log(100, 10)`) y trigonometría (`@c-sin(45 deg)`).
- **Limpieza Inteligente**: Borrado automático de la barra de búsqueda y ventana emergente al hacer clic fuera, presionar `Escape` o interactuar con la interfaz.

### Traducción Instantánea
Traduce rápidamente cualquier nota a más de 100 idiomas sin salir de Quillon:
- **Uso**: Escribe `@t-[idioma]` (ej. `@t-es`, `@t-hindi`, `@t-fr`) en cualquier parte de una nota y presiona **Enter**.
- **Gratis e Ilimitado**: Utiliza un backend robusto para proporcionar traducciones a gran escala e instantáneas de forma gratuita.
- **Retroalimentación Visual**: Muestra un indicador de carga mientras la traducción está en progreso.
- **Específico por Nota**: Solo traduce el contenido de la nota actual que estás editando.

### Cerebro IA (Resumir y Ampliar)
Transforma rápidamente notas largas en resúmenes concisos o explicaciones sencillas:
- **Uso**: Escribe `@summary` o `@elaboration` en cualquier parte de una nota y presiona **Enter**.
- **Reescritura Completa**: La IA reemplaza **toda** la nota con el contenido generado.

### Comando Hyper-Architect (`@new-`)
El comando más poderoso de Quillon. Crea notas completamente características directamente desde la barra de búsqueda con inteligencia y estilo.

**Sintaxis**: `@new-[Título] || [Contenido o Comando] || [Atributos]`

#### Reglas del Delimitador (`||`)
*   **Para Separación de Título**: `||` es **obligatorio** si quieres un título personalizado.
    *   `@new-Reunión || Notas de discusión` → Título: "Reunión"
    *   `@new-Solo algo de texto` → Título: "Nota sin título" (no se usa `||`)
*   **Para Atributos**: `||` es **opcional** entre contenido y atributos.
    *   `@new-Título || Contenido || ##etiqueta || es:fav` → Funciona 
    *   `@new-Título || Contenido ##etiqueta es:fav` → Funciona (los espacios también funcionan)
*   **Flexibilidad de Espaciado**: Funciona con o sin espacios alrededor de `||`.
    *   `@new-Título||Contenido||##etiqueta` → Funciona 
    *   `@new-Título || Contenido || ##etiqueta` → Funciona 

#### Comandos de Inteligencia (Anidados)
Puedes anidar estos dentro del contenido para obtener datos antes de guardar:
*   **`@pai-[consulta]`**: Pregúntale a Pownin AI una respuesta detallada en texto plano (sanitizada).
*   **`@wiki-[tema]`**: Obtiene un resumen completo de Wikipedia.
*   **`@def-[palabra]`**: Obtiene definición y fonética del diccionario.
*   **`@t-[idioma] [texto]`**: Traduce el contenido a cualquier idioma (ej. `@t-es`).
*   **`@c-[matemática]`**: Resuelve ecuaciones complejas y coloca el resultado en tu nota.
*   **`@summary`**: Toma tu texto y lo reduce a un resumen con viñetas.
*   **`@elaboration`**: Explica tu texto en un lenguaje sencillo y claro.

#### Banderas de Atributo (Desordenadas)
Mezcla estas en cualquier parte de la sección de contenido (desordenadas):
*   **Color**: `c:blue`, `c:pink`, `c:purple`, `c:green`, `c:yellow`, `c:orange`
*   **Fuente**: `f:Caveat`, `f:Inter`, etc.
*   **Banderas**: 
    *   `is:fav` o `is:star` — Marcar como Favorito
    *   `is:pin` — Fijar en la parte superior
    *   `is:vault` o `is:private` — Guardar en Espacio Privado
    *   `is:hide` — Ocultar de la Vista Principal
*   **Lógica de Etiquetas**: 
    *   `##etiqueta` — Estándar (**Gris**)
    *   `##fileCarpeta` — Carpetas (**Azul**)
    *   **Las etiquetas verdes** son automáticas dentro de las carpetas.
    *   **Las etiquetas ámbar** aparecen al usar `is:hide` o `@hide`.

> [!TIP]
> **Ejemplo Completo**: `@new-Einstein || @wiki-Albert Einstein || ##ciencia ##fileTrabajo || c:purple || is:fav || is:pin`
> 
> **Estilo Compacto**: `@new-Notas||Contenido aquí||##trabajo||is:star`
> 
> **IA Directa**: `@new-@pai-Explica la computación cuántica||is:fav` (omite el título, crea "Nota sin título")

### Búsqueda Rápida de Información
Obtén información factual y definiciones al instante:
- **Barra de Búsqueda**: Escribe `@wiki-[tema]` o `@def-[palabra]` y presiona **Enter** para ver una **Ventana Emergente en Markdown** rica y desplazable con íconos y encabezados formateados.
- **Editor de Notas**: Escribe los mismos comandos dentro de tu nota para insertar el resultado como **Texto Plano Limpio**.
- **Soporte Multi-Tema**: Usa "y", "&", o comas (ej. `@wiki-Sam Altman y Mira Murati`).
- **Precisión**: Utiliza APIs directas de Wikipedia y Diccionario para garantizar el 100% de precisión sin alucinaciones de IA.

### Temporizador Pomodoro
Concéntrate en tu trabajo con un temporizador Pomodoro integrado:
- **Uso**: Escribe `@pomo-[tiempo]` en cualquier parte de una nota y presiona **Enter**.
- **Formatos Flexibles**: Soporta `@pomo-1h`, `@pomo-15m`, `@pomo-1m 30s`, `@pomo-3h 4m 5s`.
- **Predeterminado**: Simplemente escribe `@pomo` para una sesión estándar de 25 minutos.
- **Acción**: Inicia una cuenta regresiva con una barra de progreso visual y un distintivo de tiempo en la parte superior del editor.

### Utilidades Externas
Obtén datos en tiempo real y realiza conversiones directamente en tu nota:
- **Clima**: Escribe `@w-[ciudad]` (ej. `@w-Londres`) para obtener el clima local instantáneo.
- **Moneda**: Escribe `@cc-[monto][de] a [para]` (ej. `@cc-100usd a eur`). 
  - **Datos en Vivo**: Obtiene las **tasas de cambio diarias más recientes**.
  - **Importante**: Debes usar códigos de moneda de 3 letras (ej. `USD`, `EUR`, `INR`, `GBP`) en lugar de nombres completos como "euro" o "rupias".
- **Unidades**: Escribe `@u-[valor][unidad] a [unidad]` (ej. `@u-5kg a lbs`).
  - Soporta: `kg/lbs`, `km/miles`, `m/ft`, `cm/inch`, `c/f` (temperatura).

### Personalización de Fuentes
Personaliza tus notas con fuentes personalizadas para una mejor legibilidad y estilo:
- **Vista Previa en Vivo**: Escribe `@fonts` para ver todas las fuentes disponibles. En el editor de notas, cada nombre de fuente se renderiza en su tipografía real para una comparación visual instantánea.
- **Selección Rápida**: Usa `@font-[índice]` (ej. `@font-15` para Comic Neue) o `@font-[nombre]` (ej. `@font-Caveat`) para cambiar las fuentes.
- **Persistencia por Nota**: Cada nota recuerda su propia fuente de forma independiente, permitiendo diferentes fuentes para diferentes tipos de contenido.
- **Selección de Una Vez**: Las fuentes seleccionadas en la barra de búsqueda se aplican solo a la siguiente nueva nota, luego se restablecen automáticamente al valor predeterminado.
- **33 Fuentes Curadas**: Incluyendo fuentes del sistema, serifs elegantes (Playfair Display, Lora), opciones monoespaciadas (Fira Code, JetBrains Mono) y estilos a mano alzada (Comic Neue, Caveat).

### Estudio y Productividad (Análisis en Profundidad)
#### Modo Examen Zen
Convierte cualquier nota en una sesión de estudio profesional con un solo comando.

**1. Estructura de la Nota**
El motor de examen busca un patrón específico:
- **Preguntas**: Cualquier línea de texto (ej. "¿Cuál es la capital de Japón?").
- **Respuestas**: Una línea que comience con **`A: `** (ej. `A: Tokio`).
- **Agrupación**: El motor empareja automáticamente cada pregunta con la línea `A: ` inmediatamente siguiente.

**2. Comandos Inteligentes**
- **`@quiz`**: Activa el Modo Examen con las preguntas en su orden escrito natural.
- **`@quiz-s`**: Activa el **Modo Aleatorio**. Las preguntas se aleatorizan para probar el dominio real del contenido.

**3. Auto-Indexación Robusta**
¡No te preocupes por el formato! La aplicación se encarga:
- **Auto-Eliminación**: Detecta y elimina etiquetas antiguas como `Q1:`, `5.`, `Pregunta:`, o `tarea 10)` de tu nota.
- **Numeración Limpia**: Reemplaza todo con una secuencia fresca y secuencial (`1.`, `2.`, `3.`) basada en la vista actual.
- **Modo Independiente**: Si escribes solo `A: Respuesta` sin una pregunta, la aplicación aún creará una caja numerada para ella.

**4. Validación Interactiva**
- **Entrada ESCRITA**: Escribe tu respuesta y presiona **Enter** (o haz clic en **Verificar**).
- **Retroalimentación Activa**: Las respuestas correctas obtienen un verde **✓**. Las incorrectas muestran la solución con un gris **→**.
- **Revelar Pistas**: Haz clic en **Revelar** para ver la respuesta de forma neutral sin marcarla como resuelta.


#### Referencia de Idiomas Soportados
| Idioma | Atajo | Comando |
| :--- | :---: | :--- |
| **Español** | `es` | `@t-spanish` |
| **Francés** | `fr` | `@t-french` |
| **Hindi** | `hi` | `@t-hindi` |
| **Alemán** | `de` | `@t-german` |
| **Japonés** | `ja` | `@t-japanese` |
| **Chino** | `zh` | `@t-chinese` |
| **Ruso** | `ru` | `@t-russian` |
| **Árabe** | `ar` | `@t-arabic` |
| **Portugués** | `pt` | `@t-portuguese` |
| **Italiano** | `it` | `@t-italian` |
| **Coreano** | `ko` | `@t-korean` |
| **Griego** | `el` | `@t-greek` |
| **Tailandés** | `th` | `@t-thai` |

> [!IMPORTANT]
> Los nombres completos funcionan para idiomas comunes. Para todos los demás países, usa el **código atajo ISO** estándar (ej. `@t-ta` para tamil, `@t-fi` para finés). Los atajos funcionan para **cada país** soportado por Google Traductor.

### Papelera Inteligente y Acciones en Lote
Gestión eficiente de notas con operaciones en lote poderosas:
- **Ícono Esfera de Energía**: Una esfera animada hermosa que sirve como tu centro de acciones en lote
- **En la Vista Principal**:
  - Haz clic en la Esfera de Energía para entrar en modo de selección
  - Selecciona múltiples notas para eliminación en lote
  - La eliminación en lote mueve las notas a la papelera (recuperables)
- **En la Vista de Papelera**:
  - Haz clic en la Esfera de Energía para opciones de recuperación
  - Restaura notas en lote a tu espacio de trabajo
  - Elimina notas permanentemente para siempre
- **Limpieza Automática**: Las notas se eliminan automáticamente después de 30 días en la papelera

### Editor de Notas Refinado
- **Sin Distracciones**: Experiencia de edición a pantalla completa y de borde a borde.
- **Responsive**: Perfectamente optimizado para Escritorio, Tablet y Móvil.
- **Preservación de Espacios en Blanco**: Todo el formato y espaciado se preserva exactamente como lo escribes.

### Ocultar/Mostrar Notas
Un sistema especializado basado en comandos para mantener tu espacio de trabajo limpio:
- **Ocultar Notas**: Agrega la etiqueta `@hide` a cualquier nota para ocultarla de tu espacio de trabajo.
- **Identidad Visual**: Las notas ocultas cuentan con una etiqueta única **Ámbar/Dorada** con un ícono `EyeOff`.
- **Navegación Inteligente**:
    - Escribe `@show` en la barra de búsqueda para entrar a la vista de "Notas Ocultas".
    - Escribe `@show-return` para salir y volver a tu espacio de trabajo principal.
- **Privacidad Exclusiva**: La etiqueta `@hide` está restringida: las notas deben tener todas las demás etiquetas eliminadas antes de poder ocultarse, asegurando un estado oculto limpio y con propósito.

### Sistema de Doble Espacio de Trabajo
- **Espacio Público**: Tu espacio de trabajo principal para notas generales
- **Espacio Privado**: Espacio protegido con contraseña para información sensible
- **Cambio Fluidos**: Alterna entre espacios con un solo clic
- **Organización Independiente**: Cada espacio tiene sus propias etiquetas, notas favoritas y papelera

### Sistema de Sonido Interactivo
Quillon cuenta con un sistema de retroalimentación de audio global en tiempo real para una experiencia más táctil:
- **Retroalimentación Háptica**: Cada botón y elemento clicable activa un **Toque de Fieltro Digital** premium (una textura de alta frecuencia y ultra corta).
- **Desbloqueo de Audio**: Optimizado para móviles; el audio se activa en tu primera interacción.
- **Volumen Dinámico**: Los sonidos usan **Escalar al Cuadrado** para coincidir con la percepción auditiva humana.
- **Comandos**:
  - `@sound-on-[PORCENTAJE]` — Establecer volumen exacto (ej. `@sound-on-50`)
  - `@sound-on` — Habilitar sonidos hápticos
  - `@sound-off` — Silenciar todos los sonidos
- **Persistencia**: Tus preferencias de sonido y volumen se guardan localmente.

---

## Pila Tecnológica  

| Categoría  | Tecnología |
|-----------|------------|
| **Frontend** | Vite, React, TypeScript |
| **IA / RAG** | **Pownin Core** (Tubería RAG Personalizada de 5 Etapas), Llama-3, Groq SDK |
| **Gráficos 3D** | Three.js (para animación de la Esfera de Energía) |
| **Animaciones** | Framer Motion |
| **Estilos**  | CSS Modules, Tailwind |
| **Despliegue** | Netlify |

---

## Primeros Pasos – Ejecuta Quillon en tu Máquina  

### **Clonar y Configurar el Proyecto**  

#### 1. Clonar el Repositorio  
```bash
git clone https://github.com/alexcj10/Quillon.git
```

#### 2. Navegar al Directorio del Proyecto  
```bash
cd Quillon
```

#### 3. Instalar Dependencias  
```bash
npm install
```

#### 4. Iniciar el Servidor de Desarrollo  
```bash
npm run dev
```
La aplicación estará disponible en ```http://localhost:5173``` 

---

## Funcionalidades Principales  

- **Gestión de Notas** – Agregar, editar, eliminar y organizar notas con un editor sin distracciones.
- **Preguntar a Pownin (RAG)** – Chatea con tus notas, haz preguntas y obtén respuestas en markdown (`@pai-`).
- **Hyper-Architect** – Crea notas completamente características directamente desde la barra de búsqueda (`@new-`).
- **Etiquetas Inteligentes** – Jerarquía automática azul/verde/gris para una estructura sin esfuerzo.
- **Ocultar/Mostrar Notas** – Mantén tu espacio de trabajo limpio ocultando notas específicas con `@hide`.
- **Doble Espacio de Trabajo** – Cambio fluido entre espacios Públicos y Privados protegidos con contraseña.
- **Nodos (Tareas)** – Gestión rápida de tareas accesible vía comando `@nodes`.
- **Herramientas de Conocimiento** – Resúmenes instantáneos de Wikipedia (`@wiki`), definiciones (`@def`) y traducciones (`@t-`).
- **Cerebro IA** – Resume (`@summary`) o amplía (`@elaboration`) cualquier nota al instante.
- **Suite de Productividad** – Temporizador Pomodoro integrado (`@pomo`) y Modo Examen Zen (`@quiz`) para estudio.
- **Calculadora y Utilidades Inteligentes** – Resolución matemática (`@c-`), conversión de moneda/unidades y obtención de clima.
- **Personalización de Fuentes** – Personaliza notas con más de 30 fuentes curadas (`@fonts`).
- **Papelera Inteligente** – Elimina, recupera o elimina permanentemente notas en lote con la Esfera de Energía animada.
- **Sonido Interactivo** – Retroalimentación háptica satisfactoria y pistas de audio dinámicas.
- **Documentación** – Acceso rápido a la ayuda vía `@docs`.
- **UI Adaptativa** – Experiencia fluida en todos los dispositivos con diseño responsive.  

---

## Referencia Rápida de Comandos

### Comandos de Nodos
| Comando | Descripción | Espacio |
|---------|-------------|-------|
| `@nodes` | Abrir widget de Nodos | Ambos |
| `@nodes-[tarea]` | Crear nodo público | Ambos |
| `7@nodes-[tarea]` | Crear nodo privado | Ambos |

### Comandos de Atributo
| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `@c-[expresión]` | Resolver matemáticas/álgebra | `@c-2x+5=15` |
| `@pai-[consulta]` | Preguntar a Pownin AI (Markdown/Texto) | `@pai-explicar gravedad` |
| `@wiki-[tema]` | Resumen de Wikipedia | `@wiki-Tesla` |
| `@def-[palabra]` | Definición de diccionario | `@def-lógica` |
| `@summary` | Reescritura Completa: Generar Resumen | `@summary` |
| `@elaboration` | Reescritura Completa: Términos Sencillos | `@elaboration` |
| `@t-[idioma]` | Traducir nota actual | `@t-es` / `@t-hi` |
| `@pomo` | Pomodoro (25 min predeterminado) | `@pomo` |
| `@pomo-[tiempo]` | Temporizador personalizado (h/m/s) | `@pomo-1h 30m 45s` |
| `@quiz` | Modo Examen (ordenado) | `@quiz` |
| `@quiz-s` | Modo Examen (aleatorio) | `@quiz-s` |
| `@w-[ciudad]` | Obtener clima | `@w-París` |
| `@cc-[monto][d] a [p]` | Conversión de moneda | `@cc-50eur a usd` |
| `@u-[val][d] a [p]` | Conversión de unidades | `@u-10kg a lb` |

### Comandos de Fuente
| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `@fonts` | Ver todas las fuentes con vista previa | `@fonts` |
| `@font-[índice]` | Cambiar fuente por número | `@font-15` (Comic Neue) |
| `@font-[nombre]` | Cambiar fuente por nombre | `@font-Caveat` |
| `@font-d` | Restablecer a fuente predeterminada | `@font-d` |

> [!NOTE]
> Cada nota recuerda su propia fuente de forma independiente. Las fuentes seleccionadas en la barra de búsqueda se aplican solo a la siguiente nueva nota.

### Comandos de Gestión de Etiquetas
Acceso vía botón **Todas las Etiquetas** o ícono **+más**:

| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `@` | Mostrar selector de tipo de etiqueta | `@` |
| `@[tipo]-[nombre]/edit-[nuevo]` | Renombrar una etiqueta | `@blue-trabajo/edit-proyectos` |
| `@[tipo]-[nombre]/delete` | Eliminar etiqueta y notas asociadas | `@grey-archivo/delete` |
| `@[tipo]-[nombre]/pin` | Fijar/Desfijar una etiqueta | `@grey-trabajo/pin` |
| `@[tipo]-[nombre]/star` | Favoritar/Desfavoritar una etiqueta | `@blue-trabajo/star` |

### Comandos de Espacio
| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `@space` | Entrar al espacio de Fijadas y Favoritas | `@space` |
| `@space-return` | Volver a todas las etiquetas | `@space-return` |

### Comandos de Ocultar/Mostrar
| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `@show` | Entrar a la vista de Notas Ocultas | `@show` |
| `@show-return` | Salir de la vista de Notas Ocultas | `@show-return` |

### Comandos de Sonido y Audio
| Comando | Descripción | Ejemplo |
|---------|-------------|---------|
| `@sound-on` | Habilitar sonidos del sistema | `@sound-on` |
| `@sound-on-[XX]` | Establecer volumen específico (%) | `@sound-on-40` |
| `@sound-off` | Silenciar todos los sonidos | `@sound-off` |

**Tipos de Etiquetas**: `blue` (carpetas), `green` (contexto), `grey` (estándar), `orange` (grupos)
> [!TIP]
> Usa la etiqueta `@hide` en notas individuales para moverlas a la vista oculta. ¡Elimina todas las demás etiquetas primero!

---

## Contribuir  

¡Bienvenidas las contribuciones a **Quillon**! Para comenzar:

1. **Haz un Fork** del repositorio.
2. **Crea** una nueva rama (`git checkout -b feature/TuNombreDeCaracterística`).
3. **Commitea** tus cambios (`git commit -m 'Agregar alguna característica'`).
4. **Push** a la rama (`git push origin feature/TuNombreDeCaracterística`).
5. **Abre** un pull request.

🔹 Sigue el estilo y estructura de código existentes.  
🔹 Escribe mensajes de commit significativos.  
🔹 Prueba los cambios a fondo antes de enviar.  

Consulta las pautas detalladas de contribución en el archivo **[CONTRIBUTING.md](https://github.com/alexcj10/Quillon/blob/main/CONTRIBUTING.md)**.

---

## Licencia  

Este proyecto está licenciado bajo la **Licencia Exclusiva de Quillon**. Consulta **[LICENSE](https://github.com/alexcj10/Quillon/blob/main/Quillon%20Exclusive%20License)** para más detalles.

---

## Agradecimientos  

¡Gracias a **Vite, React** y a la comunidad de código abierto por hacer que el desarrollo sea fluido!  
Agradecimiento especial a **TÚ** por revisar **Quillon**!   


---

**¡Sigue el proyecto, dale una** **en [GitHub](https://github.com/alexcj10/Quillon), y construyamos algo increíble juntos!**
