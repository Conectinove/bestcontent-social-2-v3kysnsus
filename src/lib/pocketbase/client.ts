import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// GUARDA (regressão já ocorrida 8x): o export nomeado `pb` é obrigatório —
// várias partes do app importam { pb }. Não remover.
export { pb }
