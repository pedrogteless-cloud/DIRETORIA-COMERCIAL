import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// Metadados de produto (cores + descrição) vindos de produtos_cores, a
// fonte da verdade — as telas de preço, promoção e catálogo mesclam por
// aqui em vez de depender da cópia desnormalizada em tabela_precos.cores.
// Retorna um mapa { [produto]: { cores, descricao } }.
export function useProdutosMeta() {
  const [meta, setMeta] = useState({})

  useEffect(() => {
    let vivo = true
    supabase
      .from('produtos_cores')
      .select('produto, cores, descricao')
      .then(({ data }) => {
        if (!vivo) return
        setMeta(Object.fromEntries((data || []).map((m) => [m.produto, m])))
      })
    return () => {
      vivo = false
    }
  }, [])

  return meta
}
