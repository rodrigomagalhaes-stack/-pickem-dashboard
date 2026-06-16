import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const BATCH = 500

export function useEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(null) // null=checking, true, false

  const fetchEvents = useCallback(async () => {
    if (!supabase) { setConnected(false); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('pickem_eventos')
      .select('*')
      .order('criado_em', { ascending: false })
    if (error) {
      setConnected(false)
    } else {
      setConnected(true)
      setEvents(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const saveEvent = useCallback(async (nome, meta, entries) => {
    if (!supabase) throw new Error('Supabase não configurado')

    const { data: evData, error: evErr } = await supabase
      .from('pickem_eventos')
      .insert({
        nome,
        periodo_inicio: meta.periodoInicio,
        periodo_fim: meta.periodoFim,
        periodo_label: meta.periodoLabel,
        total_entradas: meta.totalEntradas,
        usuarios_unicos: meta.usuariosUnicos,
        ganhadores: meta.ganhadores,
        payout: meta.payout,
        media_acertos: meta.mediaAcertos,
        win_threshold: meta.winThreshold,
        premio_max: meta.premioMax,
        dist: meta.dist,
      })
      .select()
      .single()

    if (evErr) throw evErr

    // Inserir entradas em batches
    for (let i = 0; i < entries.length; i += BATCH) {
      const batch = entries.slice(i, i + BATCH).map((e) => ({
        evento_id: evData.id,
        data_aposta: e.data_aposta,
        user_external_id: e.user_external_id,
        is_test: e.is_test,
        is_restricted: e.is_restricted,
        status: e.status,
        acertos: e.acertos,
        premio: e.premio,
      }))

      const { error: batchErr } = await supabase
        .from('pickem_entradas')
        .upsert(batch, { onConflict: 'evento_id,user_external_id' })

      if (batchErr) throw batchErr
    }

    await fetchEvents()
    return evData
  }, [fetchEvents])

  const deleteEvent = useCallback(async (id) => {
    if (!supabase) throw new Error('Supabase não configurado')
    const { error } = await supabase.from('pickem_eventos').delete().eq('id', id)
    if (error) throw error
    await fetchEvents()
  }, [fetchEvents])

  const fetchEntries = useCallback(async (eventoId, acertos = null) => {
    if (!supabase) throw new Error('Supabase não configurado')
    let query = supabase
      .from('pickem_entradas')
      .select('user_external_id, acertos, status, premio, data_aposta')
      .eq('evento_id', eventoId)
    if (acertos != null) query = query.eq('acertos', acertos)
    const { data, error } = await query
    if (error) throw error
    return data || []
  }, [])

  return { events, loading, connected, fetchEvents, saveEvent, deleteEvent, fetchEntries }
}
