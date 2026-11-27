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
  duracion?: string;
  categoria?: string;
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
    descripcion: 'Esmaltado en gel de alto brillo y acabado uniforme sobre uña natural con secado UV.',
    emoji: '💅',
    duracion: '45 min',
    categoria: 'Manicura',
  },
  {
    id: 'acrilicas-full',
    nombre: 'Uñas Acrílicas Full Set',
    descripcion: 'Set completo de acrílico esculpido con forma a elección y acabado profesional duradero.',
    emoji: '✨',
    duracion: '90 min',
    categoria: 'Acrílico',
  },
  {
    id: 'retoque-acrilico',
    nombre: 'Retoque de Acrílico',
    descripcion: 'Relleno de crecimiento, nivelación de estructura, limado y nuevo esmaltado.',
    emoji: '💎',
    duracion: '60 min',
    categoria: 'Mantenimiento',
  },
  {
    id: 'sistema-sin-olor',
    nombre: 'Sistema sin olor',
    descripcion: 'Extensiones ligeras, resistentes e inodoras con acabado limpio y estilizado.',
    emoji: '🌸',
    duracion: '75 min',
    categoria: 'Especial',
  },
  {
    id: 'manicure-clasica',
    nombre: 'Manicura Clásica',
    descripcion: 'Cuidado completo de cutículas, limado anatómico, hidratación profunda y esmaltado.',
    emoji: '🤍',
    duracion: '40 min',
    categoria: 'Manicura',
  },
  {
    id: 'pedicure-spa',
    nombre: 'Pedicura Spa',
    descripcion: 'Tratamiento relajante para pies con exfoliación herbal, masajes e hidratación.',
    emoji: '🦶',
    duracion: '60 min',
    categoria: 'Pedicura',
  },
  {
    id: 'pedicure-gel',
    nombre: 'Pedicura en Gel',
    descripcion: 'Cuidado integral de pies complementado con esmaltado en gel de larga duración.',
    emoji: '🌺',
    duracion: '60 min',
    categoria: 'Pedicura',
  },
  {
    id: 'diseno-nail-art',
    nombre: 'Diseño / Nail Art',
    descripcion: 'Personalización de uñas con mano alzada, francesas modernas, pedrería o efectos.',
    emoji: '🎨',
    duracion: '30 min',
    categoria: 'Arte',
  },
  {
    id: 'retiro-unas',
    nombre: 'Retiro Seguro de Uñas',
    descripcion: 'Remoción cuidadosa de sistemas acrílicos o gel protegiendo la salud de la uña.',
    emoji: '🧴',
    duracion: '30 min',
    categoria: 'Remoción',
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
        setError('Ese día y hora ya están ocupados. Por favor elige otro horario.');
      } else {
        setError(`No se pudo procesar la solicitud: ${dbError.message}`);
      }
    } else {
      const textoWA = encodeURIComponent(
        `Hola Macdona Nails, acabo de solicitar una cita desde la web.\n\n` +
          `👤 *Cliente:* ${nombre.trim()}\n` +
          `📱 *Teléfono:* ${telefonoLimpio}\n` +
          `💅 *Servicio:* ${servicioSeleccionado.nombre}\n` +
          `📅 *Fecha:* ${fecha}\n` +
          `⏰ *Hora:* ${hora} (hasta ${horaFin})\n` +
          `📌 *Estado:* Pendiente de confirmación`
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
      setErrorConsulta('Error al consultar las citas. Inténtalo más tarde.');
    } else {
      setCitasEncontradas(data || []);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0d14] text-slate-100 pb-20 antialiased selection:bg-[#d946ef] selection:text-white">
      {/* Glow de fondo para efecto Luxury */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-[128px]"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px]"></div>
      </div>

      {/* Header Prémium */}
      <header className="bg-[#121522]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-fuchsia-500/20">
              💅
            </div>
            <div>
              <span className="font-extrabold text-base tracking-wider text-white block leading-none">
                MACDONA NAILS
              </span>
              <span className="text-[10px] uppercase font-medium tracking-widest text-fuchsia-400">
                Studio & Care
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
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-fuchsia-300 border border-fuchsia-500/30 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-fuchsia-500/10"
          >
            Consultar mi cita
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pt-12 pb-8 text-center">
        <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-fuchsia-400 bg-fuchsia-500/10 px-3.5 py-1 rounded-full border border-fuchsia-500/20 mb-3">
          Reserva en línea
        </span>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          Catálogo de Servicios
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-3 max-w-xl mx-auto leading-relaxed">
          Elige el tratamiento ideal para tus uñas, selecciona tu horario preferido y agenda en segundos.
        </p>
      </section>

      {/* Grid de Servicios */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICIOS.map((servicio) => (
            <article
              key={servicio.id}
              className="group bg-[#161a2b]/90 hover:bg-[#1a1f35] rounded-2xl p-6 border border-white/10 hover:border-fuchsia-500/40 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-fuchsia-500/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center text-2xl shadow-inner">
                    {servicio.emoji}
                  </div>
                  {servicio.duracion && (
                    <span className="text-[11px] font-medium text-slate-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                      ⏱️ {servicio.duracion}
                    </span>
                  )}
                </div>

                {servicio.categoria && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-400 block mb-1">
                    {servicio.categoria}
                  </span>
                )}

                <h2 className="text-lg font-bold text-white group-hover:text-fuchsia-200 transition-colors">
                  {servicio.nombre}
                </h2>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {servicio.descripcion}
                </p>
              </div>

              <button
                type="button"
                onClick={() => abrirAgendaConServicio(servicio)}
                className="mt-6 w-full py-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-semibold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-fuchsia-600/20 hover:shadow-fuchsia-600/40 transition-all duration-200 cursor-pointer active:scale-[0.99]"
              >
                Agendar cita
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Modal Agendar Cita */}
      {servicioSeleccionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#161a2b] text-slate-100 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative border border-white/15">
            <button
              type="button"
              onClick={cerrarModalAgenda}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold transition-colors cursor-pointer w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
            >
              ✕
            </button>

            {mensajeExito ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">
                    ¡Solicitud registrada!
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Tu cita de <strong className="text-slate-200">{servicioSeleccionado.nombre}</strong> para el{' '}
                    <strong className="text-slate-200">{fecha}</strong> a las{' '}
                    <strong className="text-slate-200">{hora}</strong> ha sido enviada con éxito.
                  </p>
                </div>

                {urlWhatsApp && (
                  <a
                    href={urlWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
                  >
                    <span>💬</span> Notificar por WhatsApp ahora
                  </a>
                )}

                <button
                  type="button"
                  onClick={cerrarModalAgenda}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Volver al catálogo
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5 pb-4 border-b border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-fuchsia-400">
                    Servicio a reservar
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {servicioSeleccionado.nombre}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {servicioSeleccionado.descripcion}
                  </p>
                </div>

                <form onSubmit={handleAgendar} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. María García"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0f121d] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. 8298283763"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0f121d] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#0f121d] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Hora
                      </label>
                      <input
                        type="time"
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#0f121d] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs text-rose-400 font-medium text-center pt-1">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full mt-3 py-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-fuchsia-600/30 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {enviando ? 'Procesando cita...' : 'Confirmar Reserva'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Consulta de Estado de Citas */}
      {modalConsultaAbierto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#161a2b] text-slate-100 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative border border-white/15">
            <button
              type="button"
              onClick={() => setModalConsultaAbierto(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold transition-colors cursor-pointer w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
            >
              ✕
            </button>

            <h3 className="text-lg font-extrabold text-white mb-1">
              Consultar estado de cita
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Ingresa el número telefónico utilizado para tu reservación.
            </p>

            <form onSubmit={handleBuscarCitas} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Ej. 8298283763"
                  value={telefonoConsulta}
                  onChange={(e) => setTelefonoConsulta(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#0f121d] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={buscandoCitas}
                  className="px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold text-xs rounded-xl transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap shadow-md shadow-fuchsia-600/20"
                >
                  {buscandoCitas ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </form>

            {errorConsulta && (
              <p className="text-xs text-rose-400 mt-3 text-center font-medium">
                {errorConsulta}
              </p>
            )}

            {citasEncontradas && (
              <div className="mt-5 pt-4 border-t border-white/10 max-h-60 overflow-y-auto space-y-3 custom-scrollbar">
                {citasEncontradas.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No se encontraron citas registradas con este número.
                  </p>
                ) : (
                  citasEncontradas.map((cita) => {
                    const statusLower = (cita.status || '').toLowerCase();
                    let badgeBg = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                    let badgeLabel = cita.status;

                    if (statusLower === 'confirmada' || statusLower === 'confirmed') {
                      badgeBg = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                      badgeLabel = 'Confirmada';
                    } else if (statusLower === 'cancelada' || statusLower === 'cancelled') {
                      badgeBg = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
                      badgeLabel = 'Cancelada';
                    } else if (statusLower === 'pendiente' || statusLower === 'pending') {
                      badgeBg = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                      badgeLabel = 'Pendiente';
                    }

                    return (
                      <div
                        key={cita.id}
                        className="p-3.5 bg-[#0f121d] rounded-2xl border border-white/5 text-left flex justify-between items-center"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">
                            {cita.service_name || 'Servicio de uñas'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            📅 {cita.appointment_date} · ⏰ {cita.start_time}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badgeBg}`}>
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