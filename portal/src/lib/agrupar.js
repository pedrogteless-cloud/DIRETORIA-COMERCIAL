// Agrupa uma lista de itens por produto, preservando a ordem de chegada.
// Usado nas telas de preço, promoção e catálogo pra não repetir a mesma
// lógica de agrupamento em cada componente.
export function agruparPorProduto(itens) {
  const grupos = []
  const indice = new Map()
  for (const item of itens) {
    let grupo = indice.get(item.produto)
    if (!grupo) {
      grupo = { produto: item.produto, items: [] }
      indice.set(item.produto, grupo)
      grupos.push(grupo)
    }
    grupo.items.push(item)
  }
  return grupos
}
