import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: manter o duplo export (default + nomeado `pb`) — regressão recorrente (14×)
export { pb }
export default pb
