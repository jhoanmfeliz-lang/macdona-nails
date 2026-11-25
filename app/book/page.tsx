'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Service {
  id: string
  name: string
  price: number
  duration_minutes: number
}

export default function BookPage() {
  const supabase = createClient()
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadServices() {
      const { data } = await supabase.from('services').select('*').eq('is_active', true)
      if (data) setServices(data)
    }
    loadServices()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('appointments').insert([
      {
        client_name: clientName,
        client_phone: clientPhone,
        service_id: selectedService,
        appointment_date: date,
        start_time: time,
        end_time: time,
        status: 'pending'
      }
    ])

    setLoading(false)
    if (!error) setSuccess(true)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-green-50 rounded-xl text-center">
        <h2 className="text-2xl font-bold text-green-800">¡Cita Solicitada! 🎉</h2>
        <p className="mt-2 text-green-700">Confirmaremos por WhatsApp.</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-lg rounded-2xl">
      <h1 className="text-2xl font-bold text-center text-pink-600 mb-6">Reserva tu Cita 💅</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tu Nombre</label>
          <input 
            type="text" required value={clientName} 
            onChange={(e) => setClientName(e.target.value)}
            className="w-full mt-1 p-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input 
            type="tel" required value={clientPhone} 
            onChange={(e) => setClientPhone(e.target.value)}
            className="w-full mt-1 p-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Servicio</label>
          <select 
            required value={selectedService} 
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full mt-1 p-2 border rounded-md"
          >
            <option value="">Selecciona un servicio</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} - ${s.price} ({s.duration_minutes} min)
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha</label>
            <input 
              type="date" required value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hora</label>
            <input 
              type="time" required value={time} 
              onChange={(e) => setTime(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
            />
          </div>
        </div>
        <button 
          type="submit" disabled={loading}
          className="w-full bg-pink-500 text-white py-2 rounded-md font-semibold hover:bg-pink-600"
        >
          {loading ? 'Reservando...' : 'Confirmar Cita'}
        </button>
      </form>
    </div>
  )
}