import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: manter SEMPRE o duplo export (default + nomeado `pb`).
// Já regressou 28× — vários módulos importam { pb } nomeado, outros o default.
export { pb }
export default pb
