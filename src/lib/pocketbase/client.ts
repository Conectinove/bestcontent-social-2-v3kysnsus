import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// Guarda: manter o duplo export (default + nomeado). Já houve regressões que removeram o nomeado.
export { pb }
export default pb
