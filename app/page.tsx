'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TELEFONO_SALON_WHATSAPP = '8298283763';

interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  emoji: string;
}

interface CitaEncontrada {
  id: string;
  client_name: string;
  service_name: string;
  appointment_date: string;
  start_time: string;
  status: string;
}

const SERVICIOS: Servicio[] = [
  {
    id: 'pintado-en-gel',
    nombre: 'Pintado en Gel',
    descripcion: 'Esmaltado en gel de alto brillo y acabado uniforme sobre uña natural.',
    emoji: '💅',
  },
  {
    id: 'acrilicas-full',
    nombre: 'Uñas Acrílicas Full Set',
    descripcion: 'Set completo de acrílico con forma a elección y acabado profesional.',
    emoji: '✨',
  },
  {
    id: 'retoque-acrilico',
    nombre: 'Retoque de Acrílico',
    descripcion: 'Relleno de crecimiento, limado, nivelación y nuevo esmaltado.',
    emoji: '💎',
  },
  {
    id: 'sistema-sin-olor',
    nombre: 'Sistema sin olor',
    descripcion: 'Extensiones ligeras y resistentes con acabado limpio y estilizado.',
    emoji: '🌸',
  },
  {
    id: 'manicure-clasica',
    nombre: 'Manicura Clásica',
    descripcion: 'Limpieza de cutículas, limado, hidratación y esmaltado tradicional.',
    emoji: '🤍',
  },
  {
    id: 'pedicure-spa',
    nombre: 'Pedicura Spa',
    descripcion: 'Cuidado relajante de pies, exfoliación, limpieza y acabado suave.',
    emoji: '🦶',
  },
  {
    id: 'pedicure-gel',
    nombre: 'Pedicura en Gel',
    descripcion: 'Cuidado completo de pies con esmaltado en gel de larga duración.',
    emoji: '🌺',
  },
  {
    id: 'diseno-nail-art',
    nombre: 'Diseño / Nail Art',
    descripcion: 'Detalles personalizados, francesas, pedrería o efectos especiales.',
    emoji: '🎨',
  },
  {
    id: 'retiro-unas',
    nombre: 'Retiro Seguro de Uñas',
    descripcion: 'Retiro cuidadoso de acrílico o gel protegiendo la uña natural.',
    emoji: '🧴',
  },
];

export default function CatalogoPage() {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);

  // Estados Formulario Agenda
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [error, setError] = useState('');
  const [urlWhatsApp, setUrlWhatsApp] = useState('');

  // Estados Modal Consulta de Citas
  const [modalConsultaAbierto, setModalConsultaAbierto] = useState(false);
  const [telefonoConsulta, setTelefonoConsulta] = useState('');
  const [buscandoCitas, setBuscandoCitas] = useState(false);
  const [citasEncontradas, setCitasEncontradas] = useState<CitaEncontrada[] | null>(null);
  const [errorConsulta, setErrorConsulta] = useState('');

  const abrirAgendaConServicio = (servicio: Servicio) => {
    setServicioSeleccionado(servicio);
    setMensajeExito(false);
    setError('');
  };

  const cerrarModalAgenda = () => {
    setServicioSeleccionado(null);
    setNombre('');
    setTelefono('');
    setFecha('');
    setHora('');
    setError('');
    setMensajeExito(false);
    setUrlWhatsApp('');
  };

  const handleAgendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioSeleccionado) return;

    setEnviando(true);
    setError('');

    const telefonoLimpio = telefono.trim();
    const [hh, mm] = hora.split(':').map(Number);
    const horaFin =
      Number.isFinite(hh) && Number.isFinite(mm)
        ? `${String((hh + 1) % 24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
        : hora;

    const { error: dbError } = await supabase.from('appointments').insert([
      {
        client_name: nombre.trim(),
        phone: telefonoLimpio,
        client_phone: telefonoLimpio,
        service_name: servicioSeleccionado.nombre,
        appointment_date: fecha,
        start_time: hora,
        end_time: horaFin,
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
      const textoWA = encodeURIComponent(
        `Hola Macdona Nails, acabo de solicitar una cita desde la web.\n\n` +
          `👤 *Cliente:* ${nombre.trim()}\n` +
          `📱 *Teléfono:* ${telefonoLimpio}\n` +
          `💅 *Servicio:* ${servicioSeleccionado.nombre}\n` +
          `📅 *Fecha:* ${fecha}\n` +
          `⏰ *Hora:* ${hora} (hasta ${horaFin})\n` +
          `📌 *Estado actual:* Pendiente`
      );
      setUrlWhatsApp(`https://wa.me/1${TELEFONO_SALON_WHATSAPP}?text=${textoWA}`);
      setMensajeExito(true);
    }
  };

  const handleBuscarCitas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefonoConsulta.trim()) return;

    setBuscandoCitas(true);
    setErrorConsulta('');
    setCitasEncontradas(null);

    const busqueda = telefonoConsulta.trim();

    const { data, error: queryError } = await supabase
      .from('appointments')
      .select('id, client_name, service_name, appointment_date, start_time, status')
      .or(`phone.eq.${busqueda},client_phone.eq.${busqueda}`)
      .order('appointment_date', { ascending: false });

    setBuscandoCitas(false);

    if (queryError) {
      setErrorConsulta('Error al consultar las citas. Inténtelo más tarde.');
    } else {
      setCitasEncontradas(data || []);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f111a] text-white pb-16">
      <header className="bg-[#161926] border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">
              💅
            </div>
            <div>
              <span className="font-bold text-base tracking-wide text-white block leading-tight">
                MACDONA NAILS
              </span>
              <span className="text-[11px] uppercase tracking-wider text-gray-400">
                Catálogo de Servicios
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setModalConsultaAbierto(true);
              setCitasEncontradas(null);
              setErrorConsulta('');
              setTelefonoConsulta('');
            }}
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#c92a68]/20 hover:bg-[#c92a68]/30 text-[#e05288] border border-[#c92a68]/40 transition-colors cursor-pointer"
          >
            Consultar mi cita
          </button>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 pt-9 pb-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#e05288] mb-1">
          Sistema de Gestión y Citas
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Catálogo de Servicios
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1.5 max-w-lg mx-auto">
          Selecciona el servicio que deseas realizar y presiona{' '}
          <strong className="text-gray-200">Agendar cita</strong> para enviar tu solicitud.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 mt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICIOS.map((servicio) => (
            <article
              key={servicio.id}
              className="bg-white text-gray-800 rounded-2xl p-5 border border-gray-200 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-2xl mb-3.5">
                  {servicio.emoji}
                </div>
                <h2 className="text-base font-bold text-[#801b48]">
                  {servicio.nombre}
                </h2>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                  {servicio.descripcion}
                </p>
              </div>

              <button
                type="button"
                onClick={() => abrirAgendaConServicio(servicio)}
                className="mt-5 w-full py-2.5 bg-[#c92a68] hover:bg-[#b02259] text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Agendar cita
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Modal Agendar Cita */}
      {servicioSeleccionado && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white text-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-200">
            <button
              type="button"
              onClick={cerrarModalAgenda}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>

            {mensajeExito ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h3 className="text-lg font-bold text-gray-900">
                  ¡Solicitud registrada!
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Tu cita de <strong className="text-gray-900">{servicioSeleccionado.nombre}</strong> para el{' '}
                  <strong className="text-gray-900">{fecha}</strong> a las{' '}
                  <strong className="text-gray-900">{hora}</strong> ha sido enviada al panel administrativo.
                </p>

                {urlWhatsApp && (
                  <a
                    href={urlWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <span>💬</span> Notificar por WhatsApp
                  </a>
                )}

                <button
                  type="button"
                  onClick={cerrarModalAgenda}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Volver al catálogo
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 pb-3 border-b border-gray-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#801b48]">
                    Servicio seleccionado
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                    {servicioSeleccionado.nombre}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {servicioSeleccionado.descripcion}
                  </p>
                </div>

                <form onSubmit={handleAgendar} className="space-y-3 text-left">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      placeholder="Ingrese su nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c92a68]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="Ingrese su número"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c92a68]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c92a68]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Hora
                      </label>
                      <input
                        type="time"
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#c92a68]"
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
                    className="w-full mt-2 py-2.5 bg-[#c92a68] hover:bg-[#b02259] text-white font-semibold text-xs rounded-lg shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {enviando ? 'Enviando cita...' : 'Enviar cita'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Consulta de Estado de Citas */}
      {modalConsultaAbierto && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white text-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-200">
            <button
              type="button"
              onClick={() => setModalConsultaAbierto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-base font-bold text-gray-900 mb-1">
              Consultar estado de cita
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Ingresa el número de teléfono con el que realizaste la reservación.
            </p>

            <form onSubmit={handleBuscarCitas} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Ej: 8298283763"
                  value={telefonoConsulta}
                  onChange={(e) => setTelefonoConsulta(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c92a68]"
                  required
                />
                <button
                  type="submit"
                  disabled={buscandoCitas}
                  className="px-4 py-2 bg-[#c92a68] hover:bg-[#b02259] text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {buscandoCitas ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </form>

            {errorConsulta && (
              <p className="text-xs text-red-600 mt-3 text-center font-medium">
                {errorConsulta}
              </p>
            )}

            {citasEncontradas && (
              <div className="mt-4 pt-3 border-t border-gray-100 max-h-60 overflow-y-auto space-y-2.5">
                {citasEncontradas.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-3">
                    No se encontraron citas asociadas a este número.
                  </p>
                ) : (
                  citasEncontradas.map((cita) => {
                    const statusLower = (cita.status || '').toLowerCase();
                    let badgeBg = 'bg-amber-100 text-amber-800';
                    let badgeLabel = cita.status;

                    if (statusLower === 'confirmada' || statusLower === 'confirmed') {
                      badgeBg = 'bg-emerald-100 text-emerald-800';
                      badgeLabel = 'Confirmada';
                    } else if (statusLower === 'cancelada' || statusLower === 'cancelled') {
                      badgeBg = 'bg-rose-100 text-rose-800';
                      badgeLabel = 'Cancelada';
                    } else if (statusLower === 'pendiente' || statusLower === 'pending') {
                      badgeBg = 'bg-amber-100 text-amber-800';
                      badgeLabel = 'Pendiente';
                    }

                    return (
                      <div
                        key={cita.id}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-left flex justify-between items-center"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            {cita.service_name || 'Servicio de uñas'}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            📅 {cita.appointment_date} · ⏰ {cita.start_time}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${badgeBg}`}>
                          {badgeLabel}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}