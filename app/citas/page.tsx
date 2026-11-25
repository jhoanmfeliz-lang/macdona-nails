'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AppointmentRecord {
  id: string | number;
  appointment_date?: string;
  start_time?: string;
  status?: string;
  [key: string]: unknown;
}

export default function AdminCitasPage() {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const [citas, setCitas] = useState<AppointmentRecord[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [panelError, setPanelError] = useState('');

  const cargarCitas = useCallback(async () => {
    setLoadingCitas(true);
    setPanelError('');

    const { data, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (fetchError) {
      setPanelError(`No se pudieron cargar las citas: ${fetchError.message}`);
      setCitas([]);
    } else {
      setCitas(data || []);
    }

    setLoadingCitas(false);
  }, []);

  useEffect(() => {
    const session = localStorage.getItem('macdona_admin_session');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      cargarCitas();
    }
  }, [isAuthenticated, cargarCitas]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const userClean = usuario.trim().toLowerCase();
    const validPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '1234';

    if (
      (userClean === 'macdona nails' || userClean === 'mcdonalds night') &&
      clave === validPin
    ) {
      setIsAuthenticated(true);
      localStorage.setItem('macdona_admin_session', 'true');
      setError('');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('macdona_admin_session');
  };

  const actualizarEstado = async (id: string | number, nuevoEstado: string) => {
    setUpdatingId(id);
    setPanelError('');

    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: nuevoEstado })
      .eq('id', id);

    if (updateError) {
      setPanelError(`Error al actualizar estado: ${updateError.message}`);
    } else {
      setCitas((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: nuevoEstado } : item))
      );
    }

    setUpdatingId(null);
  };

  const getClienteNombre = (cita: AppointmentRecord) => {
    const candidates = [
      cita.client_name,
      cita.customer_name,
      cita.full_name,
      cita.name,
      cita.cliente,
    ];
    const found = candidates.find((v) => typeof v === 'string' && v.trim().length > 0);
    return (found as string) || 'Clienta';
  };

  const getServicioNombre = (cita: AppointmentRecord) => {
    const candidates = [
      cita.service_name,
      cita.service,
      cita.servicio,
      cita.treatment,
    ];
    const found = candidates.find((v) => typeof v === 'string' && v.trim().length > 0);
    return (found as string) || 'Servicio de uñas';
  };

  const getTelefonoLimpio = (cita: AppointmentRecord) => {
    const candidates = [
      cita.phone,
      cita.whatsapp,
      cita.client_phone,
      cita.customer_phone,
      cita.telefono,
    ];
    const found = candidates.find((v) => typeof v === 'string' && v.trim().length > 0);
    if (!found) return '';
    return (found as string).replace(/\D/g, '');
  };

  const construirLinkWhatsApp = (cita: AppointmentRecord) => {
    const phoneDigits = getTelefonoLimpio(cita);
    if (!phoneDigits) return null;

    const cliente = getClienteNombre(cita);
    const fecha = cita.appointment_date || 'la fecha solicitada';
    const hora = cita.start_time || 'la hora solicitada';
    const servicio = getServicioNombre(cita);

    const mensaje = `Hola ${cliente}, te escribimos de Macdona Nails 💅 sobre tu cita de ${servicio} el ${fecha} a las ${hora}.`;
    return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(mensaje)}`;
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#0f111a] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-gray-100 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center p-2 shadow-inner">
              <span className="text-4xl">💅</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#801b48] uppercase mb-1">
            MACDONA NAILS
          </h1>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-6">
            SISTEMA DE GESTIÓN Y CITAS
          </p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Usuario
              </label>
              <input
                type="text"
                placeholder="Ingrese su usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingrese su contraseña"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#c92a68] hover:bg-[#b02259] text-white font-semibold text-sm rounded-lg shadow-md transition-colors duration-150"
            >
              Iniciar Sesión
            </button>
          </form>

          <p className="text-[11px] text-gray-400 mt-6">
            Sistema Administrativo v1.0
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Panel de Citas - Macdona Nails</h1>
          <p className="text-xs text-gray-500">Sesión activa para encargada</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarCitas}
            className="px-3.5 py-2 text-xs font-semibold bg-pink-50 hover:bg-pink-100 text-[#801b48] rounded-lg border border-pink-200 transition-colors"
          >
            Actualizar
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {panelError && (
        <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {panelError}
        </div>
      )}

      {loadingCitas ? (
        <div className="bg-white rounded-xl p-8 text-center text-sm text-gray-500 border border-gray-200">
          Cargando citas desde Supabase...
        </div>
      ) : citas.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-sm text-gray-500 border border-gray-200">
          No hay citas registradas todavía.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {citas.map((cita) => {
            const estadoActual = cita.status || 'Pendiente';
            const waLink = construirLinkWhatsApp(cita);

            return (
              <div
                key={String(cita.id)}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-gray-800">
                      {getClienteNombre(cita)}
                    </h2>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {getServicioNombre(cita)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Fecha: <span className="font-medium text-gray-700">{cita.appointment_date || '-'}</span> · Hora:{' '}
                      <span className="font-medium text-gray-700">{cita.start_time || '-'}</span>
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      estadoActual === 'Confirmada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : estadoActual === 'Cancelada'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {estadoActual}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                  <button
                    disabled={updatingId === cita.id}
                    onClick={() => actualizarEstado(cita.id, 'Confirmada')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                  <button
                    disabled={updatingId === cita.id}
                    onClick={() => actualizarEstado(cita.id, 'Cancelada')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#c92a68] hover:bg-[#b02259] text-white"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}