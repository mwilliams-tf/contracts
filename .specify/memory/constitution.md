<!--
Sync Impact Report
==================
Version change: (none) → 1.0.0
Modified principles: N/A (initial ratification)
Added sections:
  - Core Principles (8)
  - Restricciones Adicionales
  - Workflow de Desarrollo
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ updated
  - .specify/templates/spec-template.md ✅ updated
  - .specify/templates/tasks-template.md ✅ updated
  - .specify/templates/commands/*.md ⚠ N/A (directory not present)
  - README.md / docs/quickstart.md ⚠ N/A (not present)
Follow-up TODOs: none
-->

# Prototipo CLM + Chat IA — Legales Banco Constitution

## Core Principles

### I. MVP Demostrable Primero

Toda decisión de alcance, diseño e implementación MUST priorizar una demo clara de
aproximadamente 3 minutos ante el jefe del área Legal. La cobertura exhaustiva de
requisitos, casos borde y capacidades productivas quedan fuera de alcance salvo que
aporten directamente a la narrativa de la demo.

**Rationale**: Este proyecto es un prototipo de validación, no una implementación
productiva. IT construirá la solución real en una fase posterior.

### II. Dominio Legal Fiel

La terminología, tipos contractuales, estados del negocio y reglas de flujo MUST
reflejar las definiciones acordadas con el área de Legales. Las specs de negocio
existentes son la fuente de verdad del dominio; la constitution no las reemplaza ni
las duplica.

**Rationale**: La credibilidad de la demo depende de que abogados reconozcan su
propio lenguaje y procesos, no de abstracciones genéricas de software.

### III. Datos Ficticios, Flujo Real

Los contratos, documentos y correos MUST simularse con JSON, archivos locales u otros
medios estáticos en la primera fase. El flujo de usuario MUST sentirse real: solicitud,
seguimiento, consulta y citas deben seguir el recorrido que Legales espera en
producción.

**Rationale**: Separar datos simulados de experiencia creíble permite avanzar sin
integraciones bancarias mientras se valida el valor del producto.

### IV. Módulos Delimitados

CLM (solicitud, tablero, estados) y Chat IA (consulta, citas, historial) son bounded
contexts independientes. Comparten el modelo `Contract` como contrato compartido, pero
MUST implementarse por fases sin acoplar prematuramente su lógica interna.

**Rationale**: Dos módulos relacionados pero distintos requieren límites claros para
entregar valor incremental y evitar un monolito difícil de demostrar.

### V. Solo Lectura en Fuentes

El chat MUST operar en modo solo lectura sobre fuentes contractuales y de correo. Nunca
MUST modificar contratos, documentos ni enviar mails. Este principio es coherente con
FR-015 y FR-016 de la spec del chat.

**Rationale**: En un entorno bancario, las acciones de escritura sobre fuentes reales
exigen controles que este prototipo deliberadamente posterga.

### VI. Privacidad de Historial

Cada usuaria MUST ver únicamente su propio historial de chat. El área de Legales
MUST acceder al corpus contractual común compartido. No MUST existir visibilidad
cruzada de conversaciones entre usuarias en el prototipo.

**Rationale**: El historial de consultas es información sensible; el corpus contractual
es patrimonio del equipo Legal.

### VII. Simplicidad sobre Integración

Integraciones reales — Google Drive, Gmail, SSO, generación docx real, notificaciones
y permisos bancarios — MUST permanecer fuera de alcance del MVP. Cuando una
capacidad requiera integración, MUST sustituirse por una simulación local suficiente
para la demo.

**Rationale**: Las integraciones productivas son responsabilidad de IT en fase
posterior; el prototipo debe demostrar valor sin depender de infraestructura
corporativa.

### VIII. Español y Claridad

La UI, el copy, las etiquetas de estado y las respuestas del chat MUST estar en
español. El lenguaje MUST ser comprensible para abogados no técnicos, evitando
jerga de desarrollo salvo cuando el dominio legal la requiera.

**Rationale**: Los usuarios objetivo no son ingenieros; la claridad lingüística es
parte del criterio de éxito de la demo.

## Restricciones Adicionales

- La interfaz MUST marcar siempre que el prototipo opera con **datos ficticios**.
- El tablero CLM y el chat MUST priorizar contratos **en curso** y **pendientes**
  sobre históricos o cerrados.
- Las respuestas del chat MUST incluir referencia a la fuente (contrato, documento,
  mail simulado) cuando sea posible.
- No MUST reescribirse las specs de negocio existentes dentro de la constitution ni
  de los artefactos de gobernanza.
- Cualquier feature nueva MUST acotarse al MVP demostrable; capacidades productivas
  requieren acuerdo explícito de alcance (ver Governance).

## Workflow de Desarrollo

Cada feature nueva MUST seguir la secuencia:

1. **Spec** — Documentar requisitos en `specs/[###-feature]/spec.md` (las specs de
   negocio ya existentes informan el dominio; no duplicarlas).
2. **Plan** — Generar un plan acotado al MVP con `/speckit-plan`.
3. **Tasks** — Descomponer en tareas ejecutables con `/speckit-tasks`.
4. **Implement** — Ejecutar con `/speckit-implement`, validando contra la
   Constitution Check del plan.

IT implementará las integraciones reales en una fase posterior. El prototipo MUST
dejar explícitos los puntos de sustitución (datos locales → APIs reales) sin
implementarlos prematuramente.

## Governance

Esta constitution es la autoridad de gobernanza del prototipo y supersede prácticas
ad hoc no documentadas. Todos los planes (`plan.md`), specs de feature y listas de
tareas MUST verificar cumplimiento antes de implementar.

**Procedimiento de enmienda**:

1. Proponer el cambio con justificación y tipo de bump semántico (MAJOR / MINOR /
   PATCH).
2. Actualizar `.specify/memory/constitution.md` y propagar impacto a templates
   dependientes.
3. Registrar la enmienda en el Sync Impact Report del archivo.

**Política de versionado**:

- **MAJOR**: Eliminación o redefinición incompatible de principios o alcance del
  MVP (p. ej., pasar de prototipo a producto).
- **MINOR**: Nuevo principio, sección o guía materialmente expandida.
- **PATCH**: Aclaraciones, redacción o correcciones sin cambio semántico.

**Cambios de alcance del MVP**: Cualquier ampliación que transforme el prototipo en
implementación productiva MUST contar con acuerdo explícito documentado. La pregunta
guía es: *¿sigue siendo demo o pasa a producto?*

**Revisión de cumplimiento**: `/speckit-analyze` y la sección Constitution Check de
cada `plan.md` MUST validar alineación. Las violaciones de principios MUST son
CRITICAL y requieren ajustar spec, plan o tasks — no reinterpretar la constitution.

**Version**: 1.0.0 | **Ratified**: 2026-06-09 | **Last Amended**: 2026-06-09
