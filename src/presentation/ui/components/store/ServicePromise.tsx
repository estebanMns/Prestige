const PROMISES = [
  ["Originales sellados", "Producto de casa con lote verificable y empaque original."],
  ["Versiones 1.1", "Alta fidelidad olfativa y buena fijación, a una fracción del precio."],
  ["Pedido por WhatsApp", "Un asesor confirma tu envío, pago y tiempos de entrega."],
  ["Asesoría olfativa", "Nuestro asistente te recomienda según tus gustos y presupuesto."],
] as const;

export function ServicePromise() {
  return (
    <section className="wrap pb-20">
      <div className="grid overflow-hidden rounded-[14px] border border-line sm:grid-cols-2 lg:grid-cols-4">
        {PROMISES.map(([title, text]) => (
          <div key={title} className="border-b border-line p-6 last:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
            <b className="mb-1.5 block font-display text-[22px] font-normal">{title}</b>
            <span className="text-[13.5px] text-muted">{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
