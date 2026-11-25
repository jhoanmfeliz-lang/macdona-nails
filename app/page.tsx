'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Servicio {
  id: string;
  nombre: string;
  precio: string;
  descripcion: string;
  emoji: string;
}

const SERVICIOS: Servicio[] = [
  {
    id: 'pintado-en-gel',
    nombre: 'Pintado en Gel',
    precio: 'RD$ 800',
    descripcion: 'Esmaltado en gel de alto brillo y larga duración sobre uña natural.',
    emoji: '💅',
  },
  {
    id: 'acrilicas-full',
    nombre: 'Uñas Acrílicas Full Set',
    precio: 'RD$ 1,500',
    descripcion: 'Set completo de acrílico con forma a elección y acabado profesional.',
    emoji: '✨',
  },
  {
    id: 'retoque-acrilico',
    nombre: 'Retoque de Acrílico',
    precio: 'RD$ 1,000',
    descripcion: 'Relleno de crecimiento, limado, nivelación y nuevo esmaltado.',
    emoji: '💎',
  },
  {
    id: 'polygel',
    nombre: 'Sistema Polygel',
    precio: 'RD$ 1,400',
    descripcion: 'Extensiones ligeras y resistentes con acabado natural o estilizado.',
    emoji: '🌸',
  },
  {
    id: 'manicure-clasica',
    nombre: 'Manicura Clásica',
    precio: 'RD$ 600',
    descripcion: 'Limpieza de cutículas, limado, hidratación y esmaltado tradicional.',
    emoji: '🤍',
  },
  {
    id: 'pedicure-spa',
    nombre: 'Pedicura Spa',
    precio: 'RD$ 1,200',
    descripcion: 'Relajación de pies, exfoliación, limpieza y esmaltado.',
    emoji: '🦶',
  },
  {
    id: 'pedicure-gel',
    nombre: 'Pedicura en Gel',
    precio: 'RD$ 1,350',
    descripcion: 'Cuidado completo de pies con esmaltado en gel de larga duración.',
    emoji: '🌺',
  },
  {
    id: 'diseno-nail-art',
    nombre: 'Diseño / Nail Art',
    precio: 'RD$ 300',
    descripcion: 'Detalles personalizados, francesas, pedrería o efectos especiales.',
    emoji: '🎨',
  },
  {
    id: 'retiro-unas',
    nombre: 'Retiro Seguro de Uñas',
    precio: 'RD$ 500',
    descripcion: 'Retiro cuidadoso de acrílico o gel protegiendo la uña natural.',
    emoji: '🧴',
  },
];

export default function CatalogoPage() {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [error, setError] = useState('');

  const abrirAgendaConServicio = (servicio: Servicio) => {
    setServicioSeleccionado(servicio);
    setMensajeExito(false);
    setError('');
  };

  const cerrarModal = () => {
    setServicioSeleccionado(null);
    setNombre('');
    setTelefono('');
    setFecha('');
    setHora('');
    setError('');
    setMensajeExito(false);
  };

  const handleAgendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioSeleccionado) return;

    setEnviando(true);
    setError('');

    const { error: dbError } = await supabase.from('appointments').insert([
      {
        client_name: nombre.trim(),
        phone: telefono.trim(),
        service_name: servicioSeleccionado.nombre,
        appointment_date: fecha,
        start_time: hora,
        status: 'Pendiente',
      },
    ]);

    setEnviando(false);

    if (dbError) {
      if (dbError.code === '23505') {
        setError('Ese día y hora ya están ocupados. Elige otro horario.');
      } else {
        setError(`No se pudo enviar la cita: ${dbError.message}`);
      }
    } else {
      setMensajeExito(true);
    }
  };

  return (
    <main className="min-h-screen bg-[#fdf6f9] pb-16">
      <header className="bg-white border-b border-pink-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💅</span>
            <div>
              <span className="font-bold text-lg text-[#801b48] block leading-none">
                MACDONA NAILS
              </span>
              <span className="text-[11px] text-gray-500">Catálogo de Servicios</span>
            </div>
          </div>
          <a
            href="/citas"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-pink-50 text-[#801b48] hover:bg-pink-100 transition-colors"
          >
            Panel Admin
          </a>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 pt-8 pb-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800">
          Catálogo de Servicios
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1.5">
          Elige el servicio que deseas y presiona <strong>Agendar cita</strong> para enviar tu solicitud.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICIOS.map((servicio) => (
            <article
              key={servicio.id}
              className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{servicio.emoji}</span>
                  <span className="text-xs font-bold text-[#801b48] bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
                    {servicio.precio}
                  </span>
                </div>
                <h2 className="text-base font-bold text-gray-800">
                  {servicio.nombre}
                </h2>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {servicio.descripcion}
                </p>
              </div>

              <button
                type="button"
                onClick={() => abrirAgendaConServicio(servicio)}
                className="mt-5 w-full py-2.5 bg-[#c92a68] hover:bg-[#b02259] text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Agendar cita
              </button>
            </article>
          ))}
        </div>
      </section>

      {servicioSeleccionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100">
            <button
              type="button"
              onClick={cerrarModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>

            {mensajeExito ? (
              <div className="text-center py-5 space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  ¡Solicitud enviada!
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Tu cita de <strong>{servicioSeleccionado.nombre}</strong> para el{' '}
                  <strong>{fecha}</strong> a las <strong>{hora}</strong> ya fue enviada al administrador.
                </p>
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="mt-3 w-full py-2.5 bg-[#c92a68] hover:bg-[#b02259] text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Volver al catálogo
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 pb-3 border-b border-gray-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#c92a68]">
                    Servicio seleccionado
                  </span>
                  <h3 className="text-lg font-bold text-gray-800 mt-0.5">
                    {servicioSeleccionado.nombre}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {servicioSeleccionado.precio} · {servicioSeleccionado.descripcion}
                  </p>
                </div>

                <form onSubmit={handleAgendar} className="space-y-3 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre de la clienta"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. 8095551234"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Hora
                      </label>
                      <input
                        type="time"
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-red-600 font-medium text-center pt-1">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full mt-2 py-2.5 bg-[#c92a68] hover:bg-[#b02259] text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {enviando ? 'Enviando cita...' : 'Enviar cita'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}