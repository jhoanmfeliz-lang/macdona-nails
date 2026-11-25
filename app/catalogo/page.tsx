"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ServiceRecord = Record<string, unknown>;

function pickText(row: ServiceRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const val = row[key];
    if (typeof val === "string" && val.trim().length > 0) {
      return val.trim();
    }
  }
  return fallback;
}

function pickNumber(row: ServiceRecord, keys: string[], fallback: number): number {
  for (const key of keys) {
    const val = row[key];
    if (typeof val === "number" && !Number.isNaN(val)) {
      return val;
    }
  }
  return fallback;
}

export default function CatalogoPage() {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadServices() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("services").select("*");

        if (error) {
          console.error("Error de Supabase:", error);
          setErrorMsg(`Error: ${error.message}`);
        } else {
          setServices(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error inesperado:", err);
        setErrorMsg("Error al conectar con la base de datos");
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-12 text-neutral-800">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-xs uppercase tracking-widest text-neutral-400">
          BELLEZA · CUIDADO · ESTILO
        </p>
        <h1 className="mt-2 font-serif text-4xl font-bold text-neutral-900 sm:text-5xl">
          Macdona Nails
        </h1>
        <p className="mt-2 text-sm italic text-neutral-500">
          Tus uñas, nuestra pasión
        </p>

        <section className="mt-12">
          <h2 className="font-serif text-2xl text-neutral-800">
            Sistemas de Uñas
          </h2>

          {loading && (
            <p className="mt-6 text-sm text-neutral-400">Cargando catálogo...</p>
          )}

          {errorMsg && (
            <p className="mt-6 text-sm font-medium text-red-500">{errorMsg}</p>
          )}

          {!loading && !errorMsg && services.length === 0 && (
            <p className="mt-6 text-sm text-neutral-500">
              No hay servicios disponibles en este momento.
            </p>
          )}

          {!loading && !errorMsg && services.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => {
                const rawId = String(service.id ?? index);
                const title = pickText(
                  service,
                  ["name", "Manicura básica", "title", "nombre"],
                  "Servicio sin nombre"
                );
                const desc = pickText(
                  service,
                  ["description", "Acrílicas", "descripcion"],
                  ""
                );
                const duration = pickNumber(
                  service,
                  ["duration_minutes", "duration"],
                  60
                );

                const bookingHref = `/agendar?servicioId=${encodeURIComponent(
                  rawId
                )}&servicio=${encodeURIComponent(title)}`;

                return (
                  <div
                    key={rawId}
                    className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {title}
                      </h3>
                      {desc && (
                        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                          {desc}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
                      <span className="text-xs text-neutral-400">
                        Duración aprox.: {duration} min
                      </span>

                      <Link
                        href={bookingHref}
                        className="rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-700"
                      >
                        Agendar cita
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-16 rounded-2xl border border-neutral-100 bg-white p-8 shadow-sm">
          <h3 className="font-serif text-xl text-neutral-800">
            Estilos, Acabados y Formas
          </h3>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {[
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
            ].map((estilo) => (
              <span
                key={estilo}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-1.5 text-xs text-neutral-600 shadow-2xs"
              >
                {estilo}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}