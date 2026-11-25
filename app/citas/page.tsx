"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Appointment = {
  id: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  appointment_date: string;
  start_time: string;
  end_time?: string | null;
  status?: string | null;
};

// Cambia este código/PIN por el que usará la encargada de Macdona Nails
const ADMIN_ACCESS_CODE = "1234";
const AUTH_STORAGE_KEY = "macdona_nails_admin_unlocked";

function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeTime(timeStr: string): string {
  return (timeStr || "").slice(0, 5);
}

export default function VerCitasAdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [noticeMsg, setNoticeMsg] = useState("");

  const fetchAppointments = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        setErrorMsg(`Error: ${error.message}`);
      } else {
        setAppointments(Array.isArray(data) ? data : []);
      }
    } catch {
      setErrorMsg("Error de conexión al cargar las citas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (saved === "true") {
      setUnlocked(true);
      fetchAppointments();
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (passcode.trim() === ADMIN_ACCESS_CODE) {
      window.sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
      setUnlocked(true);
      setPasscode("");
      fetchAppointments();
    } else {
      setAuthError("Clave incorrecta. Inténtalo de nuevo.");
    }
  };

  const handleLock = () => {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setUnlocked(false);
    setNoticeMsg("");
  };

  const updateStatus = async (
    cita: Appointment,
    newStatus: "Confirmada" | "Cancelada"
  ) => {
    setNoticeMsg("");
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", cita.id);

      if (error) {
        setErrorMsg("No se pudo actualizar el estado: " + error.message);
      } else {
        setAppointments((prev) =>
          prev.map((item) =>
            item.id === cita.id ? { ...item, status: newStatus } : item
          )
        );
        setNoticeMsg(
          `Cita de ${cita.client_name} marcada como ${newStatus}. Puedes enviarle el mensaje por WhatsApp.`
        );
      }
    } catch {
      setErrorMsg("Error al actualizar el estado de la cita.");
    }
  };

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-12 text-neutral-800">
        <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <p className="text-center text-xs uppercase tracking-widest text-neutral-400">
            MACDONA NAILS · ACCESO ENCARGADA
          </p>
          <h1 className="mt-2 text-center font-serif text-3xl font-bold text-neutral-900">
            Agenda Privada
          </h1>
          <p className="mt-1 text-center text-xs text-neutral-500">
            Ingresa tu clave de acceso para ver y confirmar citas
          </p>

          <form onSubmit={handleUnlock} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700">
                Clave de encargada *
              </label>
              <input
                type="password"
                required
                placeholder="Ingresa la clave"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3.5 py-2 text-sm focus:border-neutral-900 focus:outline-none"
              />
            </div>

            {authError && (
              <p className="text-xs font-medium text-red-600">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
            >
              Entrar a la Agenda
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/catalogo"
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
            >
              ← Volver al Catálogo
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-12 text-neutral-800">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-400">
              MACDONA NAILS · PANEL ADMINISTRATIVO
            </p>
            <h1 className="mt-1 font-serif text-3xl font-bold text-neutral-900">
              Gestión de Citas
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchAppointments}
              className="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              Actualizar
            </button>
            <Link
              href="/catalogo"
              className="rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
            >
              Ver Catálogo
            </Link>
            <button
              onClick={handleLock}
              className="rounded-lg border border-neutral-200 bg-neutral-100 px-3.5 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200"
            >
              Salir
            </button>
          </div>
        </div>

        {noticeMsg && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
            {noticeMsg}
          </div>
        )}

        {loading && (
          <p className="mt-8 text-center text-sm text-neutral-400">
            Cargando la agenda...
          </p>
        )}

        {errorMsg && (
          <p className="mt-8 text-center text-sm font-medium text-red-500">
            {errorMsg}
          </p>
        )}

        {!loading && !errorMsg && appointments.length === 0 && (
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-12 text-center">
            <p className="text-sm font-semibold text-neutral-700">
              No hay citas registradas en la agenda.
            </p>
          </div>
        )}

        {!loading && !errorMsg && appointments.length > 0 && (
          <div className="mt-8 space-y-4">
            {appointments.map((cita) => {
              const cleanPhone = formatPhoneForWhatsApp(cita.client_phone || "");
              const currentStatus = cita.status || "Pendiente";
              const horaInicio = normalizeTime(cita.start_time);
              const horaFin = cita.end_time ? normalizeTime(cita.end_time) : "";

              const messageText =
                currentStatus === "Confirmada"
                  ? `Hola ${cita.client_name}, te escribimos de Macdona Nails para CONFIRMAR tu cita el ${cita.appointment_date} a las ${horaInicio}. ¡Te esperamos!`
                  : currentStatus === "Cancelada"
                  ? `Hola ${cita.client_name}, te escribimos de Macdona Nails. Lamentablemente tu cita del ${cita.appointment_date} a las ${horaInicio} fue cancelada. Escríbenos para reagendar.`
                  : `Hola ${cita.client_name}, recibimos tu solicitud de cita en Macdona Nails para el ${cita.appointment_date} a las ${horaInicio}. Pronto te confirmaremos.`;

              const waLink = cleanPhone
                ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    messageText
                  )}`
                : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

              return (
                <div
                  key={cita.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-bold text-white">
                        {cita.appointment_date}
                      </span>
                      <span className="text-xs font-semibold text-neutral-700">
                        {horaInicio} {horaFin ? `- ${horaFin}` : ""}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          currentStatus === "Confirmada"
                            ? "bg-emerald-100 text-emerald-800"
                            : currentStatus === "Cancelada"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {currentStatus}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-neutral-900">
                      {cita.client_name}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Tel: {cita.client_phone} | Correo: {cita.client_email}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentStatus !== "Confirmada" && (
                      <button
                        onClick={() => updateStatus(cita, "Confirmada")}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                      >
                        Confirmar
                      </button>
                    )}

                    {currentStatus !== "Cancelada" && (
                      <button
                        onClick={() => updateStatus(cita, "Cancelada")}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                      >
                        Cancelar
                      </button>
                    )}

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}