# Contexto · Laboratorio de señales

Prototipo independiente en HTML, CSS y JavaScript. Interfaz clara, sin dependencias, con servicios, activos y señales ficticios. Permite explorar un recorrido operativo realizable con funciones de Grafana. No es una instalación de Grafana ni un dashboard importable.

## Recorrido

1. **Radar:** una pregunta, cuatro prioridades y señales con fuente, servicio, host y estado. Las tarjetas abren una vista previa modal por prioridad; desde ella se puede aplicar el filtro al Radar. Las columnas permiten ordenar.
2. **Dashboard de servicio:** la evidencia abre primero un modal sobre la vista actual. El botón Abrir dashboard de servicio realiza el cambio de pantalla y conserva servicio, host y periodo. Reúne evidencia de aplicación e infraestructura y deja visibles el resultado funcional sin medir, la cobertura incompleta y la recuperación por comprobar.
3. **Indicadores:** respuesta p95, recursos, Apdex, errores HTTP, disponibilidad observada y distribución de actividad. Las variables de servicio, recurso y Top ajustan la lectura. La leyenda permite ocultar series.
4. **View e Inspect → Data:** el menú del panel amplía la visualización o muestra los datos que la sustentan. Download CSV descarga los valores ficticios. Las series temporales conservan sus muestras en el inspector.
5. **Registro de señales:** detalle de las fuentes y navegación al contexto de servicio.

Las explicaciones aparecen también al interactuar, una vez por tipo de ayuda durante la carga. El control Ayudas al interactuar permite desactivarlas. Las vistas previas identifican expresamente que el modal es propio del HTML y explican su equivalente en Grafana. Los botones de ayuda mantienen acceso a la documentación.

## Vista previa y orientación

Prioridad → señales → servicio → lectura/gráficas/evidencias se recorre dentro de un modal, sin cambiar la URL, los filtros ni la posición de la pantalla de origen. El rastro superior muestra cada paso. Cerrar o Escape devuelve al origen; Volver a prioridad permite retroceder dentro del detalle. Sólo los botones Ir a Indicadores y Abrir dashboard de servicio cambian la pantalla, con un botón de regreso y navegación del navegador.

El modal y las ayudas emergentes son características del HTML. No se afirma que el modal de investigación sea nativo de Grafana.

## Correspondencia con Grafana

| Interacción | Función documentada | Condición |
| --- | --- | --- |
| Tarjeta que filtra prioridad | Stat con un único data link al mismo dashboard | Incluir variable de severidad y periodo. Stat no muestra el interruptor One click; con un solo enlace lo abre directamente. |
| Fila que abre contexto | Table con un data link a otro dashboard | Definir claves de servicio y host, UID de destino y variables compatibles. Con varios enlaces aparece un menú. |
| Contexto conservado | Variables de URL `var-nombre`, `from` y `to` | Incluirlos explícitamente. Las rutas `?view=` pertenecen a esta demo; en Grafana se usaría `/d/UID/...`. |
| Cambiar recurso o servicio | Variables de dashboard | Las consultas deben usar las variables. |
| Ampliar o inspeccionar | Menú View e Inspect → Data | Disposición y opciones según versión y panel. |
| Exportar soporte | Download CSV del inspector | Exporta resultados de consulta y transformaciones; aquí exporta datos ficticios. |
| Ocultar una serie | Leyenda en Time series | No cambia la captura de origen. |
| Relacionar fuentes | Consultas y transformaciones con campos compatibles | La coincidencia de host y tiempo no acredita causalidad. |
| Profundizar en el origen | Data link contextual o Explore | Requiere URL, acceso y rol adecuado. El botón de esta demo explica la posibilidad y no abre un sistema real. |

View e Inspect son funciones nativas. Un modal de investigación diseñado a medida no es una función genérica de los data links; la demo ofrece esta vista previa propia del HTML y un cambio explícito a dashboards enlazados, distinguiendo ambas cosas.

## Datos y límites

- Grafana presenta datos de sus fuentes. No completa trazas, RUM o reglas funcionales ausentes.
- Una respuesta HTTP correcta no acredita una operación funcional terminada. Se representa la ausencia de medición sin inventar resultados.
- Las prioridades son ejemplos, sin SLA ni política operativa aprobada. La disponibilidad es ilustrativa.
- Las formas de las series son ejemplos normalizados al rango elegido, sin mediciones históricas. La distribución semanal es un ejemplo fijo independiente de los filtros del radar.
- Estados, recomendaciones y responsabilidades son ilustrativos. La demo no ejecuta consultas, cambios, pruebas de producción ni escalaciones.
- La edición y versión reales deben verificarse. La documentación consultada corresponde a Grafana v13.2; esto no acredita la versión instalada en ningún entorno.

El conector oficial Dynatrace admite SaaS, Managed o Environment ActiveGate. Su documentación requiere una cuenta Grafana Cloud Free, Advanced o Trial, o Grafana Enterprise con licencia activada, además de un token Dynatrace con los ámbitos necesarios. La versión mínima del plugin elegido debe comprobarse. No se da por habilitado en Grafana OSS autogestionado. RUM, trazas y diagnóstico siguen sujetos a la cobertura y condiciones de Dynatrace.

## Abrir en local

Abrir `index.html`, o ejecutar desde esta carpeta:

```text
python -m http.server 8765 --bind 127.0.0.1
```

Ingresar en `http://127.0.0.1:8765/`. No requiere paquetes, API keys ni conexión con sistemas externos. Los enlaces de documentación sí abren páginas oficiales.

## Fuentes oficiales

- [Stat](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/visualizations/stat/)
- [Table](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/visualizations/table/)
- [Data links](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/configure-data-links/)
- [Variables en URL](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/create-dashboard-url-variables/)
- [Funciones de panel](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/panel-overview/)
- [Inspector y CSV](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/panel-inspector/)
- [Explore y roles](https://grafana.com/docs/grafana/latest/visualizations/explore/get-started-with-explore/)
- [Requisitos del conector Dynatrace](https://grafana.com/docs/plugins/grafana-dynatrace-datasource/latest/configure/)
- [Dynatrace RUM](https://docs.dynatrace.com/docs/observe/digital-experience/rum)

## Autoría y distribución

Copyright © 2026 proglopez. Derechos reservados sobre los materiales originales conforme a LICENSE. Esta publicación de referencia no se ofrece bajo una licencia de código abierto. La reserva no atribuye derechos sobre marcas, herramientas o materiales de terceros. Si se publica en GitHub, aplican las posibilidades de visualización y fork previstas en sus términos: [documentación de GitHub](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository).

