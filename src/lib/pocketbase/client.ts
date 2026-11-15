import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb
// Guarda: manter sempre o duplo export (default + nomeado pb) — regressão recorrente (13x confirmada)
export { pb }
