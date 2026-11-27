'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TELEFONO_SALON_WHATSAPP = '8298283763';

const HORARIOS_BASE = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

interface Servicio {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  duracion: string;
  categoria: string;
}

interface CitaEncontrada {
  id: string;
  client_name: string;
  service_name: string;
  appointment_date: string;
  start_time: string;
  status: string;
}

interface CitaOcupada {
  start_time: string;
  end_time: string | null;
  status: string | null;
}

const SERVICIOS: Servicio[] = [
  {
    id: 'pintado-en-gel',
    codigo: '01',
    nombre: 'Pintado en Gel',
    descripcion: 'Esmaltado en gel de acabado uniforme y brillo limpio sobre uña natural.',
    duracion: '45 min',
    categoria: 'Uñas naturales',
  },
  {
    id: 'acrilicas-full',
    codigo: '02',
    nombre: 'Uñas Acrílicas Full Set',
    descripcion: 'Estructura completa esculpida a medida con acabado equilibrado y resistente.',
    duracion: '90 min',
    categoria: 'Acrílico',
  },
  {
    id: 'retoque-acrilico',
    codigo: '03',
    nombre: 'Retoque de Acrílico',
    descripcion: 'Relleno de crecimiento, balance de ápice, limado y renovación de esmalte.',
    duracion: '60 min',
    categoria: 'Mantenimiento',
  },
  {
    id: 'sistema-sin-olor',
    codigo: '04',
    nombre: 'Sistema sin olor',
    descripcion: 'Extensiones ligeras y firmes con acabado limpio y sin olor penetrante.',
    duracion: '75 min',
    categoria: 'Sistemas',
  },
  {
    id: 'manicure-clasica',
    codigo: '05',
    nombre: 'Manicura Clásica',
    descripcion: 'Limpieza de cutícula, limado preciso, hidratación y esmaltado tradicional.',
    duracion: '40 min',
    categoria: 'Cuidado',
  },
  {
    id: 'pedicure-spa',
    codigo: '06',
    nombre: 'Pedicura Spa',
    descripcion: 'Cuidado integral de pies con exfoliación suave, limpieza e hidratación.',
    duracion: '60 min',
    categoria: 'Cuidado',
  },
  {
    id: 'pedicure-gel',
    codigo: '07',
    nombre: 'Pedicura en Gel',
    descripcion: 'Limpieza y acondicionamiento de pies con esmaltado en gel de larga duración.',
    duracion: '60 min',
    categoria: 'Pedicura',
  },
  {
    id: 'diseno-nail-art',
    codigo: '08',
    nombre: 'Diseño / Nail Art',
    descripcion: 'Detalles sobrios, francesas, líneas finas o acabados personalizados.',
    duracion: '30 min',
    categoria: 'Detalle',
  },
  {
    id: 'retiro-unas',
    codigo: '09',
    nombre: 'Retiro Seguro de Uñas',
    descripcion: 'Remoción controlada de acrílico o gel cuidando la lámina natural.',
    duracion: '30 min',
    categoria: 'Cuidado',
  },
];

function horaAMinutos(horaStr: string): number {
  const [h, m] = horaStr.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

export default function CatalogoPage() {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);

  // Estados Formulario Agenda
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');

  // Disponibilidad por fecha
  const [citasOcupadas, setCitasOcupadas] = useState<CitaOcupada[]>([]);
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);

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

  useEffect(() => {
    const cargarDisponibilidad = async () => {
      if (!fecha) {
        setCitasOcupadas([]);
        return;
      }

      setCargandoDisponibilidad(true);
      const { data, error: availError } = await supabase
        .from('appointments')
        .select('start_time, end_time, status')
        .eq('appointment_date', fecha);

      setCargandoDisponibilidad(false);

      if (!availError && data) {
        const activas = data.filter(
          (c) => (c.status || '').toLowerCase() !== 'cancelada' && (c.status || '').toLowerCase() !== 'cancelled'
        );
        setCitasOcupadas(activas);
      } else {
        setCitasOcupadas([]);
      }
    };

    cargarDisponibilidad();
  }, [fecha]);

  const esHorarioOcupado = (slotHora: string): boolean => {
    const slotInicio = horaAMinutos(slotHora);
    const slotFin = slotInicio + 60;

    return citasOcupadas.some((cita) => {
      const citaInicio = horaAMinutos(cita.start_time || '');
      const citaFin = cita.end_time ? horaAMinutos(cita.end_time) : citaInicio + 60;
      return slotInicio < citaFin && slotFin > citaInicio;
    });
  };

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
    setCitasOcupadas([]);
    setError('');
    setMensajeExito(false);
    setUrlWhatsApp('');
  };

  const handleAgendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioSeleccionado) return;

    if (esHorarioOcupado(hora)) {
      setError('Ese horario ya está ocupado en la fecha elegida. Selecciona otro espacio disponible.');
      return;
    }

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
          `Cliente: ${nombre.trim()}\n` +
          `Teléfono: ${telefonoLimpio}\n` +
          `Servicio: ${servicioSeleccionado.nombre}\n` +
          `Fecha: ${fecha}\n` +
          `Hora: ${hora} (hasta ${horaFin})\n` +
          `Estado: Pendiente`
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
    <main className="min-h-screen bg-[#0c0d10] text-[#f3f4f6] pb-24 antialiased">
      {/* Encabezado */}
      <header className="bg-[#0c0d10]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-amber-300/80" />
            <span className="font-semibold text-sm sm:text-base tracking-[0.2em] text-white">
              MACDONA NAILS
            </span>
            <span className="hidden md:inline text-xs text-zinc-500 border-l border-white/10 pl-3">
              Estudio de Cuidado de Uñas
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setModalConsultaAbierto(true);
              setCitasEncontradas(null);
              setErrorConsulta('');
              setTelefonoConsulta('');
            }}
            className="text-xs font-medium px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-100 border border-white/10 transition-colors cursor-pointer"
          >
            Consultar cita
          </button>
        </div>
      </header>

      {/* Cabecera editorial */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-9 border-b border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-amber-200/75 mb-2.5">
              Reservaciones y Servicios
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Catálogo de Servicios
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2.5 max-w-xl leading-relaxed">
              Selecciona un servicio y consulta los horarios disponibles para la fecha elegida. Cada cita se gestiona en bloques de 1 hora.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <div className="px-3.5 py-2 rounded-lg bg-[#13151a] border border-white/10">
              <span className="text-zinc-500 mr-1.5">Servicios:</span>
              <span className="text-zinc-200 font-medium">{SERVICIOS.length} disponibles</span>
            </div>
            <div className="px-3.5 py-2 rounded-lg bg-[#13151a] border border-white/10">
              <span className="text-zinc-500 mr-1.5">Bloque:</span>
              <span className="text-zinc-200 font-medium">1 hora por cita</span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de servicios */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-9">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICIOS.map((servicio) => (
            <article
              key={servicio.id}
              className="bg-[#13151a] rounded-xl border border-white/10 hover:border-amber-200/30 transition-colors flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-white/[0.07]">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs text-amber-200/80">
                      {servicio.codigo}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                      {servicio.categoria}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 bg-white/[0.03] px-2.5 py-1 rounded border border-white/[0.06]">
                    {servicio.duracion}
                  </span>
                </div>

                <h2 className="text-lg font-semibold text-white tracking-tight">
                  {servicio.nombre}
                </h2>
                <p className="text-xs sm:text-[13px] text-zinc-400 mt-2.5 leading-relaxed">
                  {servicio.descripcion}
                </p>
              </div>

              <div className="px-6 pb-6 pt-2">
                <button
                  type="button"
                  onClick={() => abrirAgendaConServicio(servicio)}
                  className="w-full py-2.5 px-4 bg-white text-[#0c0d10] hover:bg-amber-100 font-medium text-xs tracking-wide rounded-lg transition-colors cursor-pointer"
                >
                  Agendar cita
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Modal Agendar Cita */}
      {servicioSeleccionado && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#13151a] text-zinc-100 rounded-xl max-w-md w-full p-6 border border-white/15 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={cerrarModalAgenda}
              aria-label="Cerrar"
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-sm px-2 py-1 rounded transition-colors cursor-pointer"
            >
              ✕
            </button>

            {mensajeExito ? (
              <div className="py-3 space-y-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-400 font-medium">
                    Registro completado
                  </p>
                  <h3 className="text-lg font-semibold text-white mt-1">
                    Solicitud enviada
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                    <span className="text-zinc-200 font-medium">{servicioSeleccionado.nombre}</span> el{' '}
                    <span className="text-zinc-200 font-medium">{fecha}</span> a las{' '}
                    <span className="text-zinc-200 font-medium">{hora}</span>.
                  </p>
                </div>

                {urlWhatsApp && (
                  <a
                    href={urlWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center justify-center transition-colors"
                  >
                    Enviar aviso por WhatsApp
                  </a>
                )}

                <button
                  type="button"
                  onClick={cerrarModalAgenda}
                  className="w-full py-2.5 bg-white/[0.05] hover:bg-white/[0.09] text-zinc-300 text-xs font-medium rounded-lg border border-white/10 transition-colors cursor-pointer"
                >
                  Volver al catálogo
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5 pb-4 border-b border-white/10 pr-6">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-amber-200/75">
                    <span>{servicioSeleccionado.categoria}</span>
                    <span>{servicioSeleccionado.duracion}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mt-1">
                    {servicioSeleccionado.nombre}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {servicioSeleccionado.descripcion}
                  </p>
                </div>

                <form onSubmit={handleAgendar} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0c0d10] border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-200/40"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. 8298283763"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#0c0d10] border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-200/40"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={fecha}
                        onChange={(e) => {
                          setFecha(e.target.value);
                          setHora('');
                          setError('');
                        }}
                        className="w-full px-3 py-2 bg-[#0c0d10] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-amber-200/40"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1">
                        Hora seleccionada
                      </label>
                      <input
                        type="time"
                        value={hora}
                        onChange={(e) => {
                          setHora(e.target.value);
                          setError('');
                        }}
                        className="w-full px-3 py-2 bg-[#0c0d10] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-amber-200/40"
                        required
                      />
                    </div>
                  </div>

                  {/* Espacios disponibles para la fecha elegida */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-medium text-zinc-300">
                        Espacios del día
                      </span>
                      {fecha && (
                        <span className="text-[11px] text-zinc-500">
                          {cargandoDisponibilidad ? 'Consultando...' : fecha}
                        </span>
                      )}
                    </div>

                    {!fecha ? (
                      <p className="text-[11px] text-zinc-500 bg-[#0c0d10] border border-white/[0.06] rounded-lg px-3 py-2.5">
                        Selecciona una fecha para ver los horarios libres y ocupados.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-[#0c0d10] border border-white/[0.08] rounded-lg p-2.5">
                        {HORARIOS_BASE.map((slot) => {
                          const ocupado = esHorarioOcupado(slot);
                          const seleccionado = hora === slot;

                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={ocupado}
                              onClick={() => {
                                setHora(slot);
                                setError('');
                              }}
                              className={`py-1.5 px-2 rounded text-[11px] font-medium border transition-colors ${
                                ocupado
                                  ? 'bg-rose-500/10 text-rose-400/70 border-rose-500/20 line-through cursor-not-allowed'
                                  : seleccionado
                                  ? 'bg-white text-[#0c0d10] border-white cursor-pointer'
                                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-zinc-200 border-white/10 cursor-pointer'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {error && (
                    <p className="text-xs text-rose-400 pt-1">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full mt-2 py-2.5 bg-white text-[#0c0d10] hover:bg-amber-100 font-medium text-xs rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {enviando ? 'Enviando...' : 'Enviar solicitud'}
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
          <div className="bg-[#13151a] text-zinc-100 rounded-xl max-w-md w-full p-6 border border-white/15 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setModalConsultaAbierto(false)}
              aria-label="Cerrar"
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-sm px-2 py-1 rounded transition-colors cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-base font-semibold text-white mb-1">
              Consultar estado de cita
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Escribe el número con el que registraste tu cita.
            </p>

            <form onSubmit={handleBuscarCitas} className="flex gap-2">
              <input
                type="tel"
                placeholder="Ej. 8298283763"
                value={telefonoConsulta}
                onChange={(e) => setTelefonoConsulta(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#0c0d10] border border-white/10 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-200/40"
                required
              />
              <button
                type="submit"
                disabled={buscandoCitas}
                className="px-4 py-2 bg-white text-[#0c0d10] hover:bg-amber-100 font-medium text-xs rounded-lg transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {buscandoCitas ? 'Buscando...' : 'Buscar'}
              </button>
            </form>

            {errorConsulta && (
              <p className="text-xs text-rose-400 mt-3">
                {errorConsulta}
              </p>
            )}

            {citasEncontradas && (
              <div className="mt-4 pt-4 border-t border-white/10 max-h-60 overflow-y-auto space-y-2.5">
                {citasEncontradas.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-3">
                    No se encontraron citas con ese número.
                  </p>
                ) : (
                  citasEncontradas.map((cita) => {
                    const statusLower = (cita.status || '').toLowerCase();
                    let badgeStyle = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
                    let badgeLabel = cita.status;

                    if (statusLower === 'confirmada' || statusLower === 'confirmed') {
                      badgeStyle = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
                      badgeLabel = 'Confirmada';
                    } else if (statusLower === 'cancelada' || statusLower === 'cancelled') {
                      badgeStyle = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
                      badgeLabel = 'Cancelada';
                    } else if (statusLower === 'pendiente' || statusLower === 'pending') {
                      badgeStyle = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
                      badgeLabel = 'Pendiente';
                    }

                    return (
                      <div
                        key={cita.id}
                        className="p-3 bg-[#0c0d10] rounded-lg border border-white/10 flex justify-between items-center gap-3"
                      >
                        <div>
                          <p className="text-xs font-medium text-white">
                            {cita.service_name || 'Servicio'}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {cita.appointment_date} · {cita.start_time}
                          </p>
                        </div>
                        <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border shrink-0 ${badgeStyle}`}>
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