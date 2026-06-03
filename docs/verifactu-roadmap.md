# FaktuDash VeriFactu Roadmap

## 1. Estado actual

FaktuDash esta en beta privada/pre-lanzamiento. La aplicacion prepara una arquitectura interna de trazabilidad para facturacion, pero no garantiza cumplimiento VeriFactu, no dispone de declaracion responsable y no debe presentarse con afirmaciones legales o comerciales de cumplimiento.

## 2. Que se implementa en esta fase

- Estados de factura: borrador, emitida, anulada y rectificativa.
- Bloqueo de edicion y borrado directo para facturas emitidas.
- Numeracion definitiva por `owner_id`, serie y numero secuencial al emitir.
- RPC transaccionales `issue_invoice` y `cancel_invoice`.
- Tabla `fiscal_records` para registros internos de alta/anulacion.
- Snapshot fiscal interno en `record_payload`.
- Encadenamiento interno con `previous_record_id`, `previous_hash` y `chain_sequence`.
- Audit log para eventos internos relevantes.
- Exportacion CSV con campos fiscales basicos.
- Scaffolds para hash, QR, XML y cliente AEAT marcados como pendientes.

## 3. Que NO se implementa todavia

- QR fiscal oficial.
- XML oficial AEAT.
- Validacion contra XSD oficial.
- Firma, certificados o WSDL AEAT.
- Remision real a AEAT.
- Declaracion responsable.
- Afirmaciones de cumplimiento fiscal o certificacion.

## 4. Riesgos

- El hash interno usa SHA-256 como base tecnica provisional y no debe tratarse como huella oficial.
- El payload interno no equivale al diseno de registro oficial.
- La cadena puede necesitar segmentacion futura por NIF, serie, sistema o modalidad.
- La legislacion, FAQs y validaciones tecnicas pueden cambiar.

## 5. Pendientes AEAT

- Confirmar campos exactos de registros de alta y anulacion.
- Confirmar formato, orden, normalizacion y codificacion del hash.
- Confirmar contenido y formato del QR.
- Confirmar XML, XSD, firma y WSDL.
- Confirmar reglas de modalidad VERI*FACTU/NO VERI*FACTU.

## 6. Modalidad recomendada futura

La modalidad recomendada futura es VERI*FACTU, pendiente de validacion tecnica y legal completa.

## 7. Checklist tecnico

- Identificacion del productor del software: pendiente.
- Version del sistema: pendiente.
- Modalidad soportada: pendiente.
- Descripcion del sistema: pendiente.
- Funcionalidades de facturacion: en preparacion.
- Registros de alta/anulacion: base interna implementada.
- Hash/encadenamiento: base interna provisional implementada.
- QR: pendiente.
- Firma si aplica: pendiente.
- Remision AEAT si aplica: pendiente.
- Exportacion: base CSV ampliada.
- Registro de eventos: audit log interno implementado.
- Procedimiento de conservacion: pendiente.
- Procedimiento de soporte: pendiente.
- Estado: pendiente hasta implementacion completa.

## 8. Fuentes oficiales a revisar

- Real Decreto 1007/2023.
- Orden HAC/1177/2024.
- Informacion tecnica AEAT VeriFactu.
- FAQ AEAT registros de alta.
- FAQ AEAT registros de anulacion.
- FAQ AEAT huella/hash.
- FAQ AEAT QR.
- FAQ AEAT sistemas VERI*FACTU.
