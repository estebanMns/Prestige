/**
 * Contenido de las páginas de ayuda y legales. Se mantiene separado de los componentes
 * para que el equipo pueda editarlo sin tocar la interfaz.
 */
export interface HelpSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export interface HelpPage {
  slug: string;
  title: string;
  group: "Ayuda" | "Legal";
  sections: HelpSection[];
}

export const HELP_PAGES: HelpPage[] = [
  {
    slug: "como-comprar",
    title: "Cómo comprar",
    group: "Ayuda",
    sections: [
      {
        heading: "En cinco pasos",
        list: [
          "Elige tu perfume: filtra por familia (nicho, diseñador, árabes), por hombre o mujer, o pregúntale al asesor virtual.",
          "Escoge la presentación: los mililitros y si lo quieres original o 1.1.",
          "Agrégalo al pedido y toca «Ir a pagar».",
          "Confirma tus datos: nombre, celular, dirección, ciudad y método de pago.",
          "Envía el pedido por WhatsApp. Un asesor te confirma disponibilidad, envío y cómo pagar.",
        ],
      },
      { heading: "Confirmación", paragraphs: ["Tu pedido queda confirmado cuando el asesor te responde y recibimos el pago completo."] },
    ],
  },
  {
    slug: "envios",
    title: "Envíos y entregas",
    group: "Ayuda",
    sections: [
      {
        heading: "Tiempos estimados",
        list: ["Misma ciudad de la tienda: mismo día o día siguiente.", "Ciudades principales: 1 a 3 días hábiles.", "Municipios y zonas rurales: 3 a 6 días hábiles."],
      },
      { heading: "Cómo enviamos", paragraphs: ["Despachamos con transportadoras nacionales. Cada perfume va sellado, protegido y con número de guía."] },
      { heading: "Al recibir", paragraphs: ["Revisa que la caja llegue sellada antes de firmar. Si notas golpes o el empaque abierto, déjalo anotado en la guía y escríbenos de inmediato."] },
    ],
  },
  {
    slug: "metodos-de-pago",
    title: "Métodos de pago",
    group: "Ayuda",
    sections: [
      { heading: "Pagos que aceptamos", list: ["Transferencia bancaria a nuestra cuenta empresarial.", "Nequi y Daviplata."] },
      { heading: "Pago anticipado", paragraphs: ["Despachamos tu pedido en cuanto el asesor confirma que el pago llegó."] },
      { heading: "Importante", paragraphs: ["Nuestros asesores nunca te pedirán claves, códigos de verificación ni datos bancarios por chat. Solo paga a las cuentas a nombre de Perfumería Prestige que te confirme el asesor."] },
    ],
  },
  {
    slug: "cambios-y-devoluciones",
    title: "Cambios y devoluciones",
    group: "Ayuda",
    sections: [
      { heading: "Derecho de retracto", paragraphs: ["Tienes 5 días hábiles desde que recibes el producto para retractarte (Ley 1480 de 2011). El perfume debe estar sellado y sin uso."] },
      { heading: "Producto con defecto", paragraphs: ["Si llega roto, con fuga o con falla en el atomizador, escríbenos dentro de las primeras 48 horas con fotos y video del unboxing. Lo cambiamos sin costo."] },
      { heading: "Lo que no aplica", list: ["Perfumes abiertos o usados, salvo defecto de fábrica.", "Cambios porque el aroma no fue del gusto una vez abierto."] },
    ],
  },
  {
    slug: "original-vs-1-1",
    title: "Original vs. 1.1",
    group: "Ayuda",
    sections: [
      { heading: "Original", paragraphs: ["El perfume fabricado por la casa, sellado, con lote y empaque originales."] },
      { heading: "1.1", paragraphs: ["Una versión de alta fidelidad que replica el aroma del original, con buena fijación y una fracción del precio. Nunca vendemos una versión 1.1 como original: cada presentación indica claramente su tipo."] },
    ],
  },
  {
    slug: "terminos",
    title: "Términos y condiciones",
    group: "Legal",
    sections: [
      { heading: "Precios y disponibilidad", paragraphs: ["Los precios están en pesos colombianos e incluyen IVA. El precio válido es el confirmado por el asesor al aceptar tu pedido."] },
      { heading: "Perfeccionamiento de la compra", paragraphs: ["Enviar el pedido por WhatsApp es una solicitud. La compra se perfecciona cuando el asesor la confirma y se recibe el pago completo."] },
      { heading: "Garantías", paragraphs: ["Los envíos, el retracto y las garantías se rigen por estas condiciones y por la Ley 1480 de 2011."] },
    ],
  },
  {
    slug: "privacidad",
    title: "Política de privacidad y tratamiento de datos",
    group: "Legal",
    sections: [
      { heading: "Marco legal", paragraphs: ["Tratamos tus datos según la Ley 1581 de 2012 y el Decreto 1377 de 2013."] },
      { heading: "Qué datos usamos", paragraphs: ["Nombre, celular, cédula (opcional), dirección y ciudad que escribes al hacer un pedido."] },
      { heading: "Para qué", list: ["Gestionar y despachar tu pedido.", "Comunicarnos contigo sobre tu compra.", "Cumplir obligaciones legales y contables."] },
      { heading: "Dónde quedan", paragraphs: ["La tienda no guarda tus datos de entrega en sus servidores: viajan en el mensaje de WhatsApp que tú decides enviar."] },
      { heading: "Tus derechos", paragraphs: ["Puedes conocer, actualizar, rectificar y pedir la supresión de tus datos escribiéndonos por WhatsApp o al correo de contacto."] },
    ],
  },
];

export function findHelpPage(slug: string): HelpPage | undefined {
  return HELP_PAGES.find((p) => p.slug === slug);
}
