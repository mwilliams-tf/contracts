# Feature Specification: MVP Demo Unificado CLM + Chat IA (Legales Banco)

**Feature Branch**: `001-clm-chat-mvp`

**Created**: 2026-06-09

**Status**: Draft

## Original Prompt

> MVP demo unificado para área Legales de un banco: prototipo web con datos ficticios que combine gestión centralizada de contratos (CLM lite) y chat interno con IA para consultas.
>
> Contexto:
> - Es un prototipo para mostrar al jefe de Legales, no producción.
> - IT implementará integraciones reales después.
> - Sin Drive, Gmail, SSO ni notificaciones reales en esta fase.
> - Datos simulados en archivos locales (contratos, documentos, mails).
>
> Usuarios:
> - Abogadas de Legales: ven todos los contratos, usan tablero, detalle y chat.
> - Solicitantes de otras áreas: solo ven sus propias solicitudes (opcional en MVP si falta tiempo).
>
> Alcance MVP (priorizado):
>
> P1 - Tablero CLM:
> - Listado de contratos ficticios con estado, proveedor, área solicitante, vencimiento.
> - Filtros básicos por estado y búsqueda por proveedor/servicio.
> - Priorizar contratos en curso y pendientes.
>
> P2 - Detalle de contrato:
> - Vista con estado, partes, firmantes, fechas, documentos asociados (simulados), historial de estados.
> - Identificar visualmente contratos con "Plantilla Propia" vs "Modelo del Proveedor".
>
> P3 - Chat IA para Legales:
> - Consultas en lenguaje natural sobre contratos del corpus ficticio.
> - Respuestas con citas de fuente (documento, mail, fecha, remitente, link simulado).
> - Priorizar información más reciente cuando haya conflicto entre fuentes.
> - Historial de chat privado por usuaria (no ver consultas de colegas).
>
> P4 - Solicitud simplificada (solo si entra en tiempo):
> - Formulario corto para crear solicitud con tipo "Servicios IT".
> - Origen documental: Plantilla Propia o Modelo del Proveedor.
> - Crear registro en tablero en estado "Solicitado".
>
> Fuera de alcance explícito:
> - Integración real con Drive/Gmail.
> - Envío de mails.
> - Modificación de documentos fuente.
> - Generación real de .docx desde plantillas.
> - Workflow completo con todas las transiciones y alertas automáticas.
> - Permisos/SSO del banco.
>
> Criterios de éxito de la demo (3 minutos):
> 1. Abogada abre tablero y encuentra contrato pendiente por proveedor.
> 2. Entra al detalle y ve documentos e historial.
> 3. Pregunta en chat por vencimiento, firmantes o cláusula y recibe respuesta con fuente citada.
> 4. Queda claro que es prototipo con datos ficticios.
>
> Entidades clave: Contract, Provider, Document, Mail/Source, User, Conversation, WorkflowState.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tablero CLM (Priority: P1)

Una abogada de Legales abre el prototipo y ve un tablero centralizado con todos los
contratos ficticios. Puede leer de un vistazo el estado, el proveedor, el área
solicitante y el vencimiento de cada contrato. Filtra por estado y busca por proveedor
o servicio para encontrar rápidamente un contrato pendiente. Los contratos en curso y
pendientes aparecen priorizados.

**Why this priority**: Es la puerta de entrada de la demo y el corazón del CLM lite.
Sin tablero no hay narrativa: es lo primero que el jefe de Legales debe reconocer como
"nuestra cartera de contratos".

**Independent Test**: Cargar el tablero con datos ficticios y verificar que se listan
los contratos con sus columnas clave, que el filtro por estado reduce la lista, que la
búsqueda por proveedor/servicio encuentra un contrato concreto, y que los contratos en
curso/pendientes se muestran priorizados.

**Acceptance Scenarios**:

1. **Given** el corpus ficticio cargado, **When** la abogada abre el tablero, **Then** ve la lista de contratos con estado, proveedor, área solicitante y vencimiento, y un indicador visible de "datos ficticios".
2. **Given** el tablero con varios estados, **When** filtra por un estado (p. ej. "Pendiente"), **Then** la lista muestra solo contratos en ese estado.
3. **Given** el tablero, **When** busca por nombre de proveedor o servicio, **Then** la lista se reduce a las coincidencias.
4. **Given** contratos en distintos estados, **When** abre el tablero sin filtros, **Then** los contratos en curso y pendientes aparecen priorizados sobre cerrados/históricos.

---

### User Story 2 - Detalle de Contrato (Priority: P2)

Desde el tablero, la abogada abre el detalle de un contrato y consulta su estado,
partes, firmantes, fechas relevantes, documentos asociados (simulados) e historial de
cambios de estado. Distingue visualmente si el contrato se redactó sobre "Plantilla
Propia" o sobre "Modelo del Proveedor".

**Why this priority**: Es el segundo paso de la demo (profundizar en un contrato) y da
credibilidad al dominio legal. Depende del tablero (P1) para la navegación.

**Independent Test**: Abrir el detalle de un contrato del corpus y verificar que se
muestran estado, partes, firmantes, fechas, documentos simulados, historial de estados
y la marca de origen documental (Plantilla Propia vs Modelo del Proveedor).

**Acceptance Scenarios**:

1. **Given** un contrato en el tablero, **When** la abogada lo abre, **Then** ve estado, partes, firmantes y fechas relevantes.
2. **Given** la vista de detalle, **When** la consulta, **Then** ve la lista de documentos asociados (simulados) y el historial de estados del contrato.
3. **Given** un contrato con origen documental definido, **When** abre el detalle, **Then** distingue visualmente "Plantilla Propia" de "Modelo del Proveedor".

---

### User Story 3 - Chat IA para Legales (Priority: P3)

La abogada usa un chat interno para hacer consultas en lenguaje natural sobre los
contratos del corpus ficticio (vencimientos, firmantes, cláusulas). El chat responde en
español con citas de la fuente (documento, mail, fecha, remitente y link simulado). Ante
información en conflicto, prioriza la fuente más reciente. Cada usuaria ve solo su propio
historial de conversaciones. El chat nunca modifica documentos ni envía mails.

**Why this priority**: Es el diferenciador "IA" de la demo y el tercer paso de la
narrativa. Aporta el efecto sorpresa, pero requiere que el corpus (P1/P2) sea creíble.

**Independent Test**: Hacer una pregunta sobre un contrato del corpus (p. ej. su
vencimiento) y verificar que la respuesta es pertinente, está en español, incluye al
menos una cita de fuente y que, ante datos en conflicto, refleja la fuente más reciente.
Verificar que el historial de una usuaria no es visible para otra.

**Acceptance Scenarios**:

1. **Given** el corpus ficticio, **When** la abogada pregunta por el vencimiento, firmantes o una cláusula de un contrato, **Then** recibe una respuesta en español con al menos una cita de fuente (documento/mail, fecha, remitente, link simulado).
2. **Given** dos fuentes con datos en conflicto, **When** la abogada consulta ese dato, **Then** la respuesta prioriza la información más reciente e indica su fuente.
3. **Given** dos usuarias distintas, **When** la usuaria A revisa su historial, **Then** no ve las consultas de la usuaria B.
4. **Given** cualquier consulta, **When** el chat responde, **Then** no modifica documentos ni contratos fuente ni envía mails.

---

### User Story 4 - Solicitud Simplificada (Priority: P4 — opcional)

Un solicitante (o la propia abogada) completa un formulario corto para crear una
solicitud de contrato de tipo "Servicios IT", indicando el origen documental (Plantilla
Propia o Modelo del Proveedor). Al enviarlo, se crea un registro en el tablero en estado
"Solicitado".

**Why this priority**: Cierra el ciclo de "alta de contrato" pero no es esencial para la
demo de 3 minutos. Se implementa solo si hay tiempo (ver Assumptions).

**Independent Test**: Completar el formulario con tipo "Servicios IT" y un origen
documental, enviarlo y verificar que aparece un nuevo registro en el tablero con estado
"Solicitado".

**Acceptance Scenarios**:

1. **Given** el formulario de solicitud, **When** se completa con tipo "Servicios IT" y un origen documental y se envía, **Then** se crea un registro en el tablero en estado "Solicitado".
2. **Given** el formulario, **When** se intenta enviar sin los campos requeridos, **Then** se muestra un mensaje de validación en español y no se crea el registro.

---

### Edge Cases

- **Sin resultados**: cuando un filtro o búsqueda no coincide con ningún contrato, el tablero muestra un estado vacío claro ("Sin contratos para estos criterios"), no una pantalla en blanco.
- **Contrato sin documentos o sin historial**: el detalle indica explícitamente la ausencia ("Sin documentos asociados") en lugar de dejar el área vacía.
- **Chat sin fuente disponible**: si el chat no encuentra una fuente para respaldar la respuesta, lo indica explícitamente en lugar de inventar una cita.
- **Pregunta fuera del corpus**: ante una consulta que no corresponde a ningún contrato ficticio, el chat responde que no tiene información en el corpus.
- **Historial vacío**: una usuaria sin conversaciones previas ve un estado inicial que invita a hacer la primera consulta.
- **Vencimiento pasado**: contratos vencidos se distinguen visualmente de los vigentes en tablero y detalle.

## Requirements *(mandatory)*

### Functional Requirements

**Tablero CLM (P1)**

- **FR-001**: El sistema MUST mostrar un listado de contratos ficticios con, al menos, estado, proveedor, área solicitante y fecha de vencimiento.
- **FR-002**: El sistema MUST permitir filtrar el listado por estado del contrato.
- **FR-003**: El sistema MUST permitir buscar contratos por proveedor y por servicio.
- **FR-004**: El sistema MUST priorizar visualmente los contratos en curso y pendientes sobre los cerrados o históricos.
- **FR-005**: La interfaz MUST indicar de forma visible y permanente que se trata de un prototipo con datos ficticios.

**Detalle de Contrato (P2)**

- **FR-006**: El sistema MUST mostrar una vista de detalle con estado, partes, firmantes y fechas relevantes del contrato.
- **FR-007**: El detalle MUST listar los documentos asociados simulados del contrato.
- **FR-008**: El detalle MUST mostrar el historial de estados del contrato.
- **FR-009**: El sistema MUST distinguir visualmente los contratos con origen documental "Plantilla Propia" frente a "Modelo del Proveedor".

**Chat IA para Legales (P3)**

- **FR-010**: El sistema MUST permitir consultas en lenguaje natural sobre los contratos del corpus ficticio.
- **FR-011**: El chat MUST acompañar sus respuestas con al menos una cita de fuente cuando exista (documento o mail, fecha, remitente y link simulado).
- **FR-012**: Ante información en conflicto entre fuentes, el chat MUST priorizar la información más reciente e indicar su fuente.
- **FR-013**: El sistema MUST mantener el historial de chat privado por usuaria; una usuaria no MUST poder ver las conversaciones de otra.
- **FR-014**: Las respuestas del chat MUST estar en español y ser comprensibles para abogados no técnicos.
- **FR-015**: El chat MUST operar en modo solo lectura: no MUST modificar contratos ni documentos fuente.
- **FR-016**: El chat MUST NOT enviar mails ni ejecutar ninguna acción de escritura sobre las fuentes.

**Solicitud Simplificada (P4 — opcional)**

- **FR-017**: El sistema SHOULD ofrecer un formulario corto para crear una solicitud de contrato de tipo "Servicios IT".
- **FR-018**: El formulario de solicitud SHOULD permitir seleccionar el origen documental: "Plantilla Propia" o "Modelo del Proveedor".
- **FR-019**: Al enviar una solicitud válida, el sistema SHOULD crear un registro en el tablero en estado "Solicitado".

**Acceso y Roles**

- **FR-020**: El sistema MUST permitir que las abogadas de Legales vean todos los contratos del corpus.
- **FR-021**: El sistema SHOULD restringir la vista de los solicitantes de otras áreas a sus propias solicitudes (opcional en el MVP).

**Alcance / Restricciones del Prototipo**

- **FR-022**: El sistema MUST operar exclusivamente con datos ficticios almacenados en archivos locales (contratos, documentos, mails).
- **FR-023**: El sistema MUST NOT integrarse con servicios reales (Drive, Gmail, SSO), enviar mails, generar archivos .docx reales ni modificar documentos fuente en esta fase.

### Key Entities *(include if feature involves data)*

- **Contract**: Contrato gestionado en el CLM. Atributos: estado, proveedor, área solicitante, partes, firmantes, fechas (alta, firma, vencimiento), origen documental (Plantilla Propia / Modelo del Proveedor), servicio/tipo. Relaciones: pertenece a un Provider, agrupa Documents y Sources, tiene un historial de WorkflowState.
- **Provider**: Proveedor/contraparte del contrato. Atributos: nombre, identificación, servicio asociado. Relación: uno o varios Contracts.
- **Document**: Documento simulado asociado a un contrato (p. ej. PDF/borrador). Atributos: título, tipo, fecha, link simulado. Relación: pertenece a un Contract.
- **Mail/Source**: Fuente de información simulada (mail u otro registro) citable por el chat. Atributos: remitente, fecha, asunto/contenido, link simulado. Relación: vinculada a un Contract; usada como cita en respuestas del chat.
- **User**: Usuaria del sistema. Atributos: nombre, rol (Abogada de Legales / Solicitante). Relación: posee Conversations propias; el rol determina el alcance de visibilidad de contratos/solicitudes.
- **Conversation**: Historial de chat de una usuaria. Atributos: usuaria propietaria, mensajes, citas de fuente referenciadas. Relación: privada por User.
- **WorkflowState**: Estado del contrato dentro del flujo (p. ej. Solicitado, En curso, Pendiente, Cerrado). Atributos: nombre, orden, marca de "en curso/pendiente". Relación: compone el historial de estados de un Contract.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una abogada encuentra un contrato pendiente de un proveedor concreto (filtrando o buscando) en menos de 30 segundos desde que abre el tablero.
- **SC-002**: Desde el tablero, abrir el detalle de un contrato y ver sus documentos e historial toma como máximo 2 clics.
- **SC-003**: El 100% de las respuestas del chat sobre datos presentes en el corpus incluyen al menos una cita de fuente.
- **SC-004**: Ante datos en conflicto en el corpus, la respuesta del chat refleja la fuente más reciente en el 100% de los casos de prueba definidos.
- **SC-005**: El recorrido completo de la demo (tablero → detalle → consulta en chat con fuente citada) se completa en 3 minutos o menos.
- **SC-006**: El indicador de "datos ficticios" es visible en el 100% de las pantallas principales (tablero, detalle, chat).
- **SC-007**: Una usuaria no puede acceder al historial de chat de otra usuaria en ningún flujo de la demo.

## Assumptions

- Usuarios objetivo: abogadas del área Legal del banco; los solicitantes de otras áreas son un rol secundario y opcional en el MVP.
- La terminología, tipos contractuales y estados (Solicitado, En curso, Pendiente, Cerrado, etc.) provienen de las specs de negocio existentes de Legales; esta spec las referencia y no las redefine.
- Todos los datos (contratos, documentos, mails) son ficticios y residen en archivos locales; no hay integraciones reales con Drive, Gmail ni SSO en esta fase.
- La User Story 4 (Solicitud Simplificada) es opcional: se implementa solo si hay tiempo dentro del alcance del MVP demostrable.
- La autenticación/identidad se simula (selección de usuaria) sin SSO bancario real; basta para demostrar la privacidad del historial y los roles.
- Los "links simulados" en citas y documentos apuntan a recursos locales o placeholders, no a sistemas reales.
- IT implementará las integraciones reales (Drive, Gmail, generación docx, notificaciones, permisos) en una fase posterior.
- El objetivo es una demo creíble de 3 minutos; no se busca cobertura exhaustiva del workflow ni de todas las transiciones de estado.
