export default function Home() {
  return (
    <main className="min-h-screen bg-pink-50 p-6 flex flex-col items-center justify-center text-center">
      <div className="max-w-md bg-white p-8 rounded-3xl shadow-xl border border-pink-100">
        <span className="text-4xl">💅</span>
        <h1 className="text-3xl font-bold text-pink-600 mt-4">Macdona Nails</h1>
        <p className="text-gray-500 italic mt-2">"Cómete el mundo, no tus uñas"</p>
        
        <div className="mt-6 space-y-2 text-sm text-gray-600 text-left bg-gray-50 p-4 rounded-xl">
          <p>📍 Calle Julio Cesar Limbar #16, Invi Los Mina</p>
          <p>📞 WhatsApp: (829) 828-3763</p>
        </div>

        <div className="mt-8">
          <a 
            href="/book" 
            className="block w-full bg-pink-500 text-white py-3 rounded-xl font-boldshadow-lg shadow-pink-200 hover:bg-pink-600 transition"
          >
            Reservar Cita Online
          </a>
        </div>
      </div>
    </main>
  );
}