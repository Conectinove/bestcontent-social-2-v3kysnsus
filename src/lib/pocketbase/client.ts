import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// IMPORTANTE: manter o DUPLO EXPORT (default + nomeado) — regressão recorrente.
export default pb
export { pb }
