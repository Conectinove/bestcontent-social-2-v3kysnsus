import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// GUARDA (regressão recorrente): manter SEMPRE o duplo export (default + nomeado).
export { pb }
