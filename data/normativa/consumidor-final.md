---
titulo: "Consumidor Final: cuándo se usa"
norma: "Régimen de facturación, identificación del receptor (ver también ficha CUIT/CUIL/DNI)"
fecha_corte: "2026-08-19"
confianza: "media"
fuente: "conceptual, consistente con cuit-cuil-dni.md"
---

"Consumidor Final" es la categoría que se usa cuando le facturás a una
persona que no te dio ningún documento identificatorio (ni CUIT, ni CUIL,
ni DNI), o cuando el monto de la operación no supera el umbral que
obliga a pedir documento (ver ficha `cuit-cuil-dni.md`, hoy ese umbral
son $10.000.000, a reverificar contra fuente oficial si hace mucho que no
se actualiza esta ficha).

Como monotributista, facturarle a un Consumidor Final no cambia el tipo
de comprobante, seguís emitiendo factura C igual que si le facturaras a
una empresa. La diferencia está solo en qué datos vas a poner del lado
del receptor: con Consumidor Final, alcanza con eso, sin nombre ni
documento.

**Importante para el sistema**: si el texto del usuario no menciona
ningún nombre ni documento del receptor, es un caso razonable de
Consumidor Final por default, pero si SÍ menciona un nombre, hay que
intentar identificar a esa persona (agenda de clientes / documento) antes
de asumir Consumidor Final. No usar Consumidor Final como atajo cuando
hay un nombre real mencionado en el texto.
