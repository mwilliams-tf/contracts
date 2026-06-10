# Feature Specification: Asistente Legal Conversacional Multi-Conversación (Chat IA v2)

**Feature Branch**: `002-chat-conversacional`

**Created**: 2026-06-09

**Status**: Draft

## Original Prompt

> Evolucionar el Chat IA del MVP de Legales: pasar de un único hilo
> por usuaria a un asistente legal conversacional con múltiples conversaciones,
> memoria de hilo y acceso a TODA la cartera de contratos como corpus de referencia.
>
> Contexto y motivación:
> - El chat actual responde por matching de palabras clave sobre un solo contrato por
>   pregunta y falla cuando la abogada formula distinto de lo previsto. Queremos una
>   experiencia más creíble y útil para la demo al jefe de Legales.
> - Sigue siendo un prototipo frontend-only con datos ficticios locales (JSON), sin LLM
>   real, sin SSO, sin Drive/Gmail, sin envío de mails. IT integrará lo real después.
>
> Concepto clave (corregir un malentendido del diseño anterior):
> - El chat NO pertenece a un contrato. Cada USUARIA tiene varias CONVERSACIONES.
> - Una conversación puede tener un contrato "principal" como foco (opcional), pero el
>   asistente SIEMPRE puede consultar, comparar y citar CUALQUIER contrato de la cartera
>   como referencia o precedente. El foco es un punto de partida, no un encierro.
>
> Tipos de conversación a soportar:
> 1. Portfolio (transversal): consultas sobre la cartera sin contrato fijo
>    (p. ej. "¿qué contratos vencen en 2028?").
> 2. Anchored (con foco): se trabaja sobre un contrato concreto pero se puede traer
>    información de otros contratos como referencia (p. ej. "¿cómo resolvimos esta
>    cláusula en Acme?" mientras trabajo en Stanley).
>
> Capacidades del asistente (todas en español, solo lectura sobre el corpus fuente):
> - Responder consultas en lenguaje natural sobre uno o varios contratos, con citas de
>   fuente (documento/mail, fecha, remitente, link simulado) y priorizando la fuente más
>   reciente ante conflicto.
> - Referencia cruzada entre contratos: comparar cláusulas, traer precedentes de otros
>   expedientes y proponer redacción adaptada citando los contratos de origen. Cada
>   respuesta debe indicar el contrato principal sobre el que se actúa y todos los
>   contratos referenciados.
> - Acción simulada de redacción: ante un pedido como "ampliá la cláusula", el asistente
>   propone una nueva redacción y ofrece "aplicar al borrador" del contrato principal,
>   generando un borrador de trabajo local (versión nueva) SIN modificar los documentos
>   fuente del corpus ni enviar nada. En la demo se aclara que en producción esto iría a
>   un .docx en Drive.
> - Sugerencias clicables (chips) según el estado del contrato y el tipo de conversación,
>   para guiar la demo y reducir el texto libre en vivo.
> - Fallback honesto: si no hay información en el corpus o no hay fuente que respalde una
>   respuesta, lo indica explícitamente en lugar de inventar.
>
> Multiplicidad y persistencia:
> - Bandeja/listado de conversaciones por usuaria, privada (una usuaria no ve las de otra).
> - Poder crear, abrir y continuar conversaciones; el historial se conserva.
> - Tres conversaciones de demo pre-cargadas (seeds):
>   a) Acme Cloud — conversación archivada/congelada, ya resuelta, con historial completo
>      (vencimiento con conflicto de mails resuelto por recencia, firmantes pendientes).
>   b) "Contratos que vencen en 2028" — conversación portfolio congelada con la respuesta
>      ya dada (listado real del corpus: monitoreo perimetral y locación Quilmes).
>   c) Stanley Tech — conversación en vivo (reproducible on demand) sobre la objeción a la
>      cláusula 9, que incluye al menos un turno de referencia cruzada con Acme y un turno
>      de acción de redacción aplicada al borrador de Stanley.
>
> Integración con el resto del MVP:
> - El asistente debe poder abrirse desde el detalle de un contrato precargando ese
>   contrato como foco (sin volverse exclusivo de él), y también desde la bandeja global.
> - Debe convivir con el tablero, el detalle y las transiciones de estado (workflow) ya
>   existentes; puede sugerir la transición de estado pertinente pero NO ejecutarla
>   automáticamente.
>
> Fuera de alcance (mantener): integración real con Drive/Gmail/SSO, envío de mails,
> generación real de .docx, modificación de documentos fuente del corpus, LLM externo o
> claves. Todo guionado/determinista sobre datos ficticios locales.
>
> Criterios de éxito de la demo (3 minutos):
> - Abrir la bandeja y ver varias conversaciones (Acme, 2028, Stanley) privadas de la
>   usuaria.
> - En la conversación Stanley: preguntar por la objeción de la cláusula 9 (respuesta con
>   cita), pedir cómo se resolvió en Acme (respuesta cruzada que cita Stanley y Acme),
>   pedir una redacción ampliada y aplicarla al borrador de Stanley (acción simulada).
> - Quede claro en todo momento que es un prototipo con datos ficticios y que el chat no
>   modifica fuentes reales.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bandeja de conversaciones múltiples y privadas (Priority: P1)

Una abogada de Legales abre el asistente y ve una **bandeja** con varias conversaciones
propias, no un único hilo. La bandeja muestra al menos las tres conversaciones de demo
precargadas (Acme Cloud, "Contratos que vencen en 2028", Stanley Tech), cada una con su
título, tipo (portfolio o con foco en un contrato) y estado (archivada/congelada o en
vivo). Puede crear una conversación nueva, abrir una existente y continuarla; el historial
de cada conversación se conserva. Las conversaciones son privadas: otra usuaria no ve las
de ella.

**Why this priority**: Es el cambio conceptual central de esta evolución (de "un chat por
contrato" a "muchas conversaciones por usuaria") y la puerta de entrada de la demo. Sin la
bandeja, no se puede demostrar la multiplicidad ni la privacidad, que son la base de todo
lo demás.

**Independent Test**: Abrir la bandeja como una usuaria y verificar que aparecen las tres
conversaciones seed con su tipo y estado; crear una conversación nueva y comprobar que se
suma a la lista; recargar y verificar que el historial persiste; cambiar a otra usuaria y
confirmar que no ve las conversaciones de la primera.

**Acceptance Scenarios**:

1. **Given** la usuaria activa con conversaciones seed cargadas, **When** abre la bandeja, **Then** ve una lista con al menos las conversaciones Acme Cloud, "Contratos que vencen en 2028" y Stanley Tech, cada una con título, tipo (portfolio / con foco) y estado (congelada / en vivo), más el marcador de "datos ficticios".
2. **Given** la bandeja abierta, **When** la usuaria crea una conversación nueva, **Then** se agrega a la lista y queda abierta lista para recibir la primera consulta.
3. **Given** una conversación con historial, **When** la usuaria la cierra y la vuelve a abrir (o recarga la app), **Then** el historial de mensajes se conserva íntegro.
4. **Given** dos usuarias distintas, **When** la usuaria B abre su bandeja, **Then** no ve ninguna conversación de la usuaria A.
5. **Given** una usuaria sin conversaciones propias, **When** abre la bandeja, **Then** ve un estado inicial en español que invita a iniciar la primera conversación.

---

### User Story 2 - Asistente conversacional con citas y memoria de hilo (Priority: P2)

Dentro de una conversación, la abogada hace consultas en lenguaje natural sobre uno o
varios contratos del corpus. El asistente responde en español con citas de fuente
(documento o mail, fecha, remitente y link simulado) y, ante datos en conflicto, prioriza
la fuente más reciente. Tiene **memoria de hilo**: usa los turnos anteriores de esa misma
conversación para resolver referencias (p. ej. "y el vencimiento?" o "esa cláusula"). En
una conversación **portfolio** responde consultas transversales sobre la cartera (p. ej.
"¿qué contratos vencen en 2028?" → monitoreo perimetral y locación Quilmes); en una
conversación **anclada** parte de un contrato de foco pero puede consultar otros. Si no hay
información en el corpus o no hay fuente que respalde la respuesta, lo indica
explícitamente (fallback honesto) en lugar de inventar.

**Why this priority**: Es el núcleo del valor del asistente y reemplaza el matching frágil
del MVP anterior. Sin respuestas creíbles con citas y memoria de hilo, la multiplicidad de
conversaciones (P1) está vacía de contenido.

**Independent Test**: En una conversación portfolio preguntar "¿qué contratos vencen en
2028?" y verificar que responde con el listado real del corpus citando fuentes; en una
conversación anclada en un contrato preguntar por su vencimiento y luego "¿y los
firmantes?" sin repetir el nombre, verificando que la memoria de hilo resuelve la
referencia; preguntar algo ausente del corpus y verificar el fallback honesto.

**Acceptance Scenarios**:

1. **Given** una conversación portfolio, **When** la abogada pregunta "¿qué contratos vencen en 2028?", **Then** el asistente responde en español con el listado de contratos del corpus que vencen en 2028 (monitoreo perimetral y locación Quilmes), cada uno con al menos una cita de fuente.
2. **Given** una conversación anclada en un contrato, **When** la abogada pregunta por su vencimiento y existen mails en conflicto, **Then** la respuesta refleja la fuente más reciente e indica de qué fuente proviene.
3. **Given** una respuesta previa en la misma conversación, **When** la abogada formula un turno que referencia lo anterior sin nombrar el contrato (p. ej. "¿y los firmantes?"), **Then** el asistente responde sobre el mismo contrato en foco usando la memoria de hilo.
4. **Given** una consulta sin respaldo en el corpus, **When** la abogada la envía, **Then** el asistente indica explícitamente que no tiene información o fuente en el corpus, sin inventar una cita.
5. **Given** cualquier respuesta del asistente, **When** se muestra, **Then** está en español y, cuando existe respaldo, incluye al menos una cita con documento/mail, fecha, remitente y link simulado.

---

### User Story 3 - Referencia cruzada entre contratos (Priority: P3)

Trabajando en una conversación anclada en un contrato (p. ej. Stanley Tech), la abogada
pregunta cómo se resolvió un tema equivalente en otro expediente (p. ej. "¿cómo resolvimos
esta cláusula en Acme?"). El asistente trae el precedente del otro contrato, lo compara con
el contrato en foco y, cuando corresponde, propone una redacción adaptada. La respuesta
indica con claridad cuál es el **contrato principal** sobre el que se actúa y **todos los
contratos referenciados**, citando las fuentes de cada origen.

**Why this priority**: Es el diferenciador "asistente legal de cartera" y el momento de
mayor impacto en la demo. Demuestra que el foco es un punto de partida, no un encierro.
Depende de que el asistente base (P2) ya responda con citas y memoria de hilo.

**Independent Test**: En la conversación anclada en Stanley, preguntar cómo se resolvió la
cláusula equivalente en Acme y verificar que la respuesta cita Stanley (principal) y Acme
(referenciado), señala ambos contratos y, si propone redacción, indica el contrato de
origen del precedente.

**Acceptance Scenarios**:

1. **Given** una conversación anclada en Stanley, **When** la abogada pregunta cómo se resolvió la cláusula 9 / objeción equivalente en Acme, **Then** el asistente responde trayendo el precedente de Acme y citando fuentes de ambos contratos.
2. **Given** una respuesta de referencia cruzada, **When** se muestra, **Then** indica explícitamente el contrato principal (Stanley) y la lista de contratos referenciados (Acme), de modo que la abogada sabe sobre qué actúa y de dónde proviene cada dato.
3. **Given** un pedido de precedente para el cual no existe contrato comparable en el corpus, **When** la abogada lo formula, **Then** el asistente lo indica honestamente en lugar de inventar un precedente.

---

### User Story 4 - Acción simulada de redacción aplicada al borrador (Priority: P4)

Ante un pedido de redacción (p. ej. "ampliá la cláusula 9" o "proponé una nueva redacción
adaptada del precedente de Acme"), el asistente **propone** una nueva redacción y ofrece un
botón "aplicar al borrador" del contrato principal. Al aplicarla, se genera un **borrador
de trabajo local** (una versión nueva asociada a ese contrato) sin modificar los documentos
fuente del corpus ni enviar nada. La interfaz deja claro que es una acción simulada y que en
producción esto generaría un .docx en Drive.

**Why this priority**: Cierra la narrativa "consultar → comparar → actuar" mostrando que el
asistente puede producir valor accionable, manteniendo el principio de solo lectura sobre
las fuentes. Es el último paso del recorrido de demo y depende de P2/P3.

**Independent Test**: En la conversación Stanley, pedir una redacción ampliada de la cláusula
9, aplicarla al borrador y verificar que se crea una versión de borrador de trabajo local
asociada a Stanley, que el documento fuente del corpus permanece sin cambios y que la UI
indica que es una acción simulada.

**Acceptance Scenarios**:

1. **Given** una conversación anclada en Stanley, **When** la abogada pide ampliar/redactar la cláusula 9, **Then** el asistente propone una nueva redacción en español y ofrece la acción "aplicar al borrador".
2. **Given** una redacción propuesta, **When** la abogada elige "aplicar al borrador", **Then** se genera un borrador de trabajo local (versión nueva) asociado al contrato principal y la UI lo confirma como acción simulada.
3. **Given** una redacción aplicada al borrador, **When** se inspeccionan los documentos fuente del corpus, **Then** permanecen sin modificar y no se envió ningún mail ni se generó un archivo real.
4. **Given** la acción de redacción, **When** se muestra, **Then** la UI aclara que en producción el borrador iría a un .docx en Drive (punto de sustitución).

---

### User Story 5 - Apertura contextual, sugerencias clicables y convivencia con el workflow (Priority: P5)

La abogada puede abrir el asistente desde el **detalle de un contrato**, precargando ese
contrato como foco de una conversación (sin que el asistente quede limitado a él), y también
desde la **bandeja global**. Dentro de la conversación, ve **sugerencias clicables (chips)**
adaptadas al estado del contrato y al tipo de conversación, que reducen el texto libre en
vivo. El asistente convive con el tablero, el detalle y las transiciones de estado
existentes: puede **sugerir** la transición de estado pertinente, pero nunca la ejecuta
automáticamente.

**Why this priority**: Integra el asistente con el resto del MVP y facilita conducir la demo
en vivo, pero el recorrido principal (P1–P4) ya entrega valor sin estos refinamientos.

**Independent Test**: Desde el detalle de un contrato, abrir el asistente y verificar que la
conversación arranca con ese contrato como foco pero permite consultar otros; comprobar que
aparecen chips coherentes con el estado del contrato; pedir/observar una sugerencia de
transición de estado y verificar que se ofrece pero no se ejecuta sola.

**Acceptance Scenarios**:

1. **Given** el detalle de un contrato, **When** la abogada abre el asistente desde ahí, **Then** se inicia (o reabre) una conversación con ese contrato como foco, sin impedir consultar otros contratos.
2. **Given** una conversación abierta, **When** se muestra, **Then** ofrece chips de sugerencia coherentes con el estado del contrato en foco y el tipo de conversación.
3. **Given** un chip de sugerencia, **When** la abogada lo pulsa, **Then** se envía como consulta sin que ella tenga que escribirla.
4. **Given** una situación que amerita un cambio de estado, **When** el asistente lo aborda, **Then** sugiere la transición pertinente del workflow pero no la ejecuta automáticamente.

---

### Edge Cases

- **Conversación congelada/archivada**: en las seeds Acme y "2028", la conversación se muestra como solo lectura/resuelta; queda claro que está congelada y no admite nuevos turnos (o los distingue claramente del historial cerrado).
- **Bandeja vacía**: una usuaria sin conversaciones ve un estado inicial que invita a crear la primera, no una pantalla en blanco.
- **Foco sin precedente comparable**: ante un pedido de referencia cruzada sin contrato comparable en el corpus, el asistente lo indica honestamente.
- **Consulta fuera del corpus**: ante una consulta sin respaldo, el asistente responde con el fallback honesto en lugar de inventar.
- **Conflicto de fuentes**: cuando dos fuentes contradicen un dato (p. ej. vencimiento Acme), prevalece la más reciente y la respuesta lo explicita.
- **Referencia ambigua sin contexto**: si la usuaria usa una referencia ("esa cláusula") en una conversación portfolio sin contrato en foco ni turno previo que la resuelva, el asistente pide precisión en lugar de adivinar.
- **Aplicar borrador dos veces**: aplicar una redacción al borrador más de una vez no corrompe ni duplica el documento fuente; el corpus permanece intacto.
- **Cambio de usuaria a mitad de demo**: al cambiar de usuaria, la bandeja refleja solo las conversaciones de la nueva identidad.

## Requirements *(mandatory)*

### Functional Requirements

**Bandeja y multiplicidad de conversaciones (P1)**

- **FR-001**: El sistema MUST presentar una bandeja con la lista de conversaciones de la usuaria activa, cada una con título, tipo (portfolio / con foco en un contrato) y estado (congelada/archivada o en vivo).
- **FR-002**: El sistema MUST permitir crear una conversación nueva, abrir una existente y continuar agregando turnos a una conversación en vivo.
- **FR-003**: El sistema MUST conservar el historial de cada conversación entre cierres y recargas de la aplicación.
- **FR-004**: El sistema MUST mantener las conversaciones privadas por usuaria: una usuaria no MUST poder ver las conversaciones de otra.
- **FR-005**: El sistema MUST precargar tres conversaciones de demo (seeds): (a) Acme Cloud archivada/congelada y resuelta con historial completo (vencimiento con conflicto de mails resuelto por recencia y firmantes pendientes); (b) "Contratos que vencen en 2028" portfolio congelada con la respuesta ya dada (monitoreo perimetral y locación Quilmes); (c) Stanley Tech en vivo y reproducible sobre la objeción a la cláusula 9, con al menos un turno de referencia cruzada con Acme y un turno de acción de redacción aplicada al borrador de Stanley.
- **FR-006**: La interfaz MUST indicar de forma visible y permanente que se trata de un prototipo con datos ficticios.

**Asistente conversacional, citas y memoria de hilo (P2)**

- **FR-007**: El sistema MUST permitir consultas en lenguaje natural dentro de una conversación y responder en español.
- **FR-008**: El asistente MUST soportar conversaciones de tipo portfolio (consultas transversales sobre la cartera sin contrato fijo) y de tipo anclada (con un contrato de foco que no impide consultar otros).
- **FR-009**: El asistente MUST acompañar cada respuesta respaldada por el corpus con al menos una cita de fuente (documento o mail, fecha, remitente y link simulado).
- **FR-010**: Ante datos en conflicto entre fuentes, el asistente MUST priorizar la información más reciente e indicar la fuente.
- **FR-011**: El asistente MUST usar la memoria de hilo (turnos anteriores de la misma conversación) para resolver referencias y consultas de seguimiento sin requerir repetir el contexto.
- **FR-012**: El asistente MUST aplicar un fallback honesto: si no hay información en el corpus o no hay fuente que respalde la respuesta, lo indica explícitamente y no inventa datos ni citas.
- **FR-013**: El asistente MUST ser más tolerante a variaciones de formulación que el chat anterior, evitando fallar ante reformulaciones razonables de una misma intención dentro de los escenarios de demo previstos.

**Referencia cruzada entre contratos (P3)**

- **FR-014**: El asistente MUST poder traer información de cualquier contrato de la cartera como referencia o precedente, incluso cuando la conversación está anclada en otro contrato.
- **FR-015**: El asistente MUST poder comparar cláusulas entre contratos y proponer una redacción adaptada citando el/los contrato(s) de origen del precedente.
- **FR-016**: Toda respuesta MUST indicar el contrato principal sobre el que se actúa y la lista completa de contratos referenciados.

**Acción simulada de redacción (P4)**

- **FR-017**: Ante un pedido de redacción, el asistente MUST proponer una nueva redacción en español y ofrecer la acción "aplicar al borrador" del contrato principal.
- **FR-018**: Al aplicar la redacción, el sistema MUST generar un borrador de trabajo local (versión nueva) asociado al contrato principal, sin modificar los documentos fuente del corpus.
- **FR-019**: El sistema MUST NOT modificar documentos fuente del corpus, enviar mails ni generar archivos reales (.docx) al ejecutar la acción de redacción.
- **FR-020**: La interfaz MUST indicar que la acción de redacción es simulada y señalar el punto de sustitución (en producción generaría un .docx en Drive).

**Integración, sugerencias y workflow (P5)**

- **FR-021**: El sistema MUST permitir abrir el asistente desde el detalle de un contrato precargándolo como foco de la conversación, sin restringir la consulta a ese contrato, y también desde la bandeja global.
- **FR-022**: El asistente MUST ofrecer sugerencias clicables (chips) coherentes con el estado del contrato en foco y el tipo de conversación; al pulsar un chip se envía la consulta correspondiente.
- **FR-023**: El asistente MUST poder sugerir la transición de estado del workflow pertinente, pero MUST NOT ejecutarla automáticamente.
- **FR-024**: El asistente MUST convivir con el tablero, el detalle y las transiciones de estado existentes sin alterar su comportamiento.

**Alcance / Restricciones del Prototipo**

- **FR-025**: El sistema MUST operar exclusivamente con datos ficticios locales (corpus de contratos, documentos, mails y guiones de conversación) y de forma determinista, sin LLM externo ni claves.
- **FR-026**: El sistema MUST NOT integrarse con servicios reales (Drive, Gmail, SSO), enviar mails, generar .docx reales ni modificar documentos fuente del corpus en esta fase.
- **FR-027**: La identidad de la usuaria MUST simularse (selección de usuaria) sin SSO real, suficiente para demostrar privacidad de conversaciones y apertura contextual.

### Key Entities *(include if feature involves data)*

- **Conversation**: Hilo de diálogo propiedad de una usuaria. Atributos: título, tipo (portfolio / anclada), contrato de foco (opcional, solo en anclada), estado (en vivo / congelada-archivada), fecha de creación y última actividad, orden de mensajes. Relaciones: pertenece a un User; en anclada referencia un Contract de foco; agrupa Messages.
- **Message/Turn**: Turno individual de una conversación. Atributos: rol (usuaria / asistente), contenido en español, contrato principal de la respuesta, lista de contratos referenciados, citas de fuente, posible acción propuesta (redacción) y chips sugeridos. Relación: pertenece a una Conversation; referencia Sources y Contracts.
- **Citation/Source reference**: Referencia a una fuente del corpus usada para respaldar una respuesta. Atributos: documento o mail, fecha, remitente, link simulado, contrato de origen. Relación: vincula un Message con una Source/Document y un Contract.
- **WorkingDraft**: Borrador de trabajo local generado por la acción de redacción simulada. Atributos: contrato asociado, número/etiqueta de versión, texto propuesto de la cláusula/redacción, marca de "borrador simulado", fecha. Relación: asociado a un Contract sin modificar sus documentos fuente.
- **Suggestion/Chip**: Sugerencia clicable mostrada en una conversación. Atributos: texto, consulta asociada, condición de visibilidad (estado del contrato, tipo de conversación). Relación: pertenece a una Conversation/contexto.
- **User**: Usuaria del asistente (abogada de Legales). Atributos: nombre, rol, identidad simulada. Relación: posee Conversations privadas; comparte el corpus contractual común.
- **Contract / Provider / Document / Mail-Source / WorkflowState**: Entidades del corpus existentes (definidas en `001-clm-chat-mvp`). Esta feature las consume como corpus de referencia de solo lectura; no las redefine.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al abrir la bandeja, la usuaria ve al menos las tres conversaciones seed (Acme, 2028, Stanley) con su tipo y estado, en menos de 5 segundos.
- **SC-002**: El 100% de las respuestas del asistente respaldadas por el corpus incluyen al menos una cita de fuente; el 100% de las consultas sin respaldo reciben fallback honesto sin cita inventada.
- **SC-003**: Ante datos en conflicto en el corpus, la respuesta refleja la fuente más reciente en el 100% de los casos de prueba definidos.
- **SC-004**: En las respuestas de referencia cruzada, el 100% indica explícitamente el contrato principal y la lista de contratos referenciados.
- **SC-005**: La acción "aplicar al borrador" genera una versión de borrador local en el 100% de los casos y deja los documentos fuente del corpus sin modificar en el 100% de los casos.
- **SC-006**: Una usuaria no puede acceder a las conversaciones de otra usuaria en ningún flujo de la demo (0 fugas de privacidad).
- **SC-007**: El recorrido completo de la demo (abrir bandeja → en Stanley: objeción cláusula 9 con cita → referencia cruzada con Acme → redacción ampliada aplicada al borrador) se completa en 3 minutos o menos.
- **SC-008**: El marcador de "datos ficticios" y la aclaración de que el chat no modifica fuentes reales están visibles en el 100% de las pantallas del asistente.
- **SC-009**: En el guion de demo, el asistente responde correctamente a las reformulaciones previstas de cada intención en al menos 2 variantes de redacción por intención clave (objeción cláusula 9, referencia cruzada, redacción).

## Assumptions

- Esta feature evoluciona el Chat IA definido en `001-clm-chat-mvp`; reutiliza el corpus, las entidades (Contract, Provider, Document, Mail/Source, WorkflowState) y la terminología del dominio ya existentes, sin redefinirlos.
- Sigue siendo un prototipo frontend-only, determinista y guionado sobre datos ficticios locales (JSON); no hay LLM externo, claves, SSO, Drive ni Gmail.
- La persistencia de conversaciones e historial usa almacenamiento local del navegador namespaced por identidad simulada de usuaria (mismo enfoque que el MVP anterior); no hay backend.
- La identidad de usuaria se simula mediante selección; basta para demostrar la privacidad de conversaciones y la apertura contextual desde el detalle.
- "Memoria de hilo" significa que el asistente usa los turnos anteriores de la misma conversación para resolver referencias y seguimientos dentro de los escenarios de demo previstos; no implica aprendizaje ni modelo entrenado.
- Las conversaciones seed Acme y "2028" se presentan congeladas/archivadas (solo lectura); Stanley es la conversación en vivo reproducible que conduce la demo.
- Los contratos del corpus que vencen en 2028 son los ya presentes (monitoreo perimetral y locación Quilmes); la respuesta seed de la conversación portfolio se basa en esos registros.
- Los "links simulados" en citas y borradores apuntan a recursos locales o placeholders, no a sistemas reales; el borrador de trabajo es un objeto local, no un .docx.
- IT implementará las integraciones reales (Drive, Gmail, generación docx, notificaciones, permisos, LLM real) en una fase posterior; el prototipo deja explícitos los puntos de sustitución.
- El objetivo es una demo creíble de 3 minutos; no se busca cobertura exhaustiva de NLP ni de todas las variantes de formulación posibles, sino robustez sobre el guion de demo.
