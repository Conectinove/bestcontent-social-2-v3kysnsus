import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// GUARDA (regressão 22×): manter SEMPRE o export nomeado junto do default.
// Várias rodadas anteriores perderam um dos dois e quebraram imports de pb.
export { pb }
