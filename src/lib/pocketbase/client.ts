import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// GUARDA DE REGRESSÃO: manter SEMPRE o export nomeado também —
// várias partes do app importam { pb } (regressão silenciosa já ocorreu 8x).
export { pb }
