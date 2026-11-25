"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ESTILOS_OPCIONES = [
  "Francesa",
  "Baby Boomer",
  "Esculpidas",
  "Diseños personalizados",
  "Encapsuladas",
  "Glitter",
  "Cat Eye",
  "Mate",
  "Stiletto",
  "Almendra",
];

const SALON_WHATSAPP_NUMBER = "";

function normalizeTime(timeStr: string): string {
  return (timeStr || "").slice(0, 5);
}

function addMinutesToTime(timeStr: string, minutesToAdd = 60): string {
  const [hoursStr, minutesStr] = timeStr.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return timeStr;
  }

  const totalMinutes = (hours * 60 + minutes + minutesToAdd) % (24 * 60);
  const endHours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const endMinutes = String(totalMinutes % 60).padStart(2, "0");

  return `${endHours}:${endMinutes}`;
}

function buildWhatsAppUrl(params: {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceName: string;
  styleName: string;
  appointmentDate: string;
  startTime: string;
}): string {
  const lines = [
    "Hola Macdona Nails, quiero confirmar mi solicitud de cita:",
    `• Cliente: ${params.clientName}`,
    `• Servicio: ${params.serviceName}`,
    params.styleName ? `• Estilo / Acabado: ${params.styleName}` : null,
    `• Fecha: ${params.appointmentDate}`,
    `• Hora: ${params.startTime}`,
    `• Teléfono: ${params.clientPhone}`,
    `• Correo: ${params.clientEmail}`,
  ].filter(Boolean);

  const encodedText = encodeURIComponent(lines.join("\n"));

  if (SALON_WHATSAPP_NUMBER.trim().length > 0) {
    return `https://wa.me/${SALON_WHATSAPP_NUMBER.trim()}?text=${encodedText}`;
  }

  return `https://wa.me/?text=${encodedText}`;
}

function BookingForm() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("servicioId") || "";
  const serviceName = searchParams.get("servicio") || "Servicio de Uñas";

  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    style_name: "",
    appointment_date: "",
    start_time: "",
  });

  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadBookedTimesForDate() {
      if (!formData.appointment_date) {
        setBookedTimes([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("appointments")
          .select("start_time, status")
          .eq("appointment_date", formData.appointment_date);

        if (!error && Array.isArray(data)) {
          const taken = data
            .filter((row) => (row.status || "Pendiente") !== "Cancelada")
            .map((row) => normalizeTime(String(row.start_time || "")))
            .filter(Boolean);

          setBookedTimes(Array.from(new Set(taken)));
        }
      } catch (err) {
        console.error("Error cargando horarios ocupados:", err);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadBookedTimesForDate();
  }, [formData.appointment_date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createClient();
      const selectedTime = normalizeTime(formData.start_time);

      const { data: existingAppts, error: checkError } = await supabase
        .from("appointments")
        .select("id, start_time, status")
        .eq("appointment_date", formData.appointment_date);

      if (checkError) {
        console.error("Error comprobando disponibilidad:", checkError);
      }

      const isSlotTaken =
        Array.isArray(existingAppts) &&
        existingAppts.some(
          (appt) =>
            (appt.status || "Pendiente") !== "Cancelada" &&
            normalizeTime(String(appt.start_time || "")) === selectedTime
        );

      if (isSlotTaken) {
        setErrorMsg(
          `Ese día (${formData.appointment_date}) y hora (${formData.start_time}) no están disponibles. Por favor elige otra hora.`
        );
        setLoading(false);
        return;
      }

      const computedEndTime = addMinutesToTime(formData.start_time, 60);

      const payload: Record<string, unknown> = {
        client_name: formData.client_name.trim(),
        client_phone: formData.client_phone.trim(),
        client_email: formData.client_email.trim(),
        appointment_date: formData.appointment_date,
        start_time: formData.start_time,
        end_time: computedEndTime,
        status: "Pendiente",
      };

      if (UUID_REGEX.test(serviceId)) {
        payload.service_id = serviceId;
      }

      const { error } = await supabase.from("appointments").insert([payload]);

      if (error) {
        if (error.code === "23505") {
          setErrorMsg(
            "Ese día y hora no están disponibles porque ya fueron reservados."
          );
        } else {
          setErrorMsg(`Error: ${error.message}`);
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      setErrorMsg("Error de conexión. Inténtalo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const whatsappHref = buildWhatsAppUrl({
      clientName: formData.client_name.trim(),
      clientPhone: formData.client_phone.trim(),
      clientEmail: formData.client_email.trim(),
      serviceName,
      styleName: formData.style_name,
      appointmentDate: formData.appointment_date,
      startTime: formData.start_time,
    });

    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <h2 className="font-serif text-2xl font-bold text-neutral-900">
          ¡Cita Solicitada!
        </h2>
        <p className="mt-3 text-sm text-neutral-600">
          Gracias <strong>{formData.client_name}</strong>. Hemos recibido tu
          solicitud para <strong>{serviceName}</strong>
          {formData.style_name ? (
            <>
              {" "}
              (estilo <strong>{formData.style_name}</strong>)
            </>
          ) : null}{" "}
          el <strong>{formData.appointment_date}</strong> a las{" "}
          <strong>{formData.start_time}</strong>.
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          Estado inicial: <strong>Pendiente de confirmación</strong>.
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Enviar por WhatsApp
          </a>
          <Link
            href="/catalogo"
            className="inline-block rounded-lg bg-neutral-900 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
          >
            Volver al Catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-neutral-200 bg-white p-8 text-left shadow-sm"
    >
      <div className="mb-6 rounded-lg bg-neutral-100 p-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Servicio seleccionado
        </span>
        <h3 className="mt-0.5 text-lg font-bold text-neutral-900">
          {serviceName}
        </h3>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-700">
            Nombre completo *
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Maria Lopez"
            value={formData.client_name}
            onChange={(e) =>
              setFormData({ ...formData, client_name: e.target.value })
            }
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3.5 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700">
            Teléfono / WhatsApp *
          </label>
          <input
            type="tel"
            required
            placeholder="Ej. 8098855522"
            value={formData.client_phone}
            onChange={(e) =>
              setFormData({ ...formData, client_phone: e.target.value })
            }
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3.5 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700">
            Correo electrónico *
          </label>
          <input
            type="email"
            required
            placeholder="Ej. maria@ejemplo.com"
            value={formData.client_email}
            onChange={(e) =>
              setFormData({ ...formData, client_email: e.target.value })
            }
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3.5 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-700">
            Estilo, acabado o forma (opcional)
          </label>
          <select
            value={formData.style_name}
            onChange={(e) =>
              setFormData({ ...formData, style_name: e.target.value })
            }
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-sm focus:border-neutral-900 focus:outline-none"
          >
            <option value="">A definir en el salón</option>
            {ESTILOS_OPCIONES.map((estilo) => (
              <option key={estilo} value={estilo}>
                {estilo}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-700">
              Fecha deseada *
            </label>
            <input
              type="date"
              required
              value={formData.appointment_date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  appointment_date: e.target.value,
                  start_time: "",
                })
              }
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3.5 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700">
              Hora deseada *
            </label>
            <input
              type="time"
              required
              value={formData.start_time}
              onChange={(e) =>
                setFormData({ ...formData, start_time: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3.5 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
          </div>
        </div>

        {formData.appointment_date && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs">
            {loadingSlots ? (
              <p className="text-neutral-400">Revisando disponibilidad...</p>
            ) : bookedTimes.length > 0 ? (
              <div>
                <p className="font-semibold text-amber-800">
                  Horas no disponibles el {formData.appointment_date}:
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {bookedTimes.map((hora) => (
                    <span
                      key={hora}
                      className="rounded-md bg-red-100 px-2 py-0.5 font-medium text-red-800"
                    >
                      {hora} (Ocupada)
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="font-medium text-emerald-700">
                ✓ Hay disponibilidad en el horario seleccionado para este día.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <Link
          href="/catalogo"
          className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Confirmando..." : "Confirmar Cita"}
        </button>
      </div>
    </form>
  );
}

export default function AgendarPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-12 text-neutral-800">
      <div className="mx-auto max-w-lg text-center">
        <p className="text-xs uppercase tracking-widest text-neutral-400">
          BELLEZA · CUIDADO · ESTILO
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-neutral-900">
          Macdona Nails
        </h1>
        <p className="mt-1 text-xs italic text-neutral-500">Reserva de cita</p>

        <div className="mt-8">
          <Suspense
            fallback={
              <p className="text-sm text-neutral-400">Cargando datos...</p>
            }
          >
            <BookingForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}