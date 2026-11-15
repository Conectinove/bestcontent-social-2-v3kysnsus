import PocketBase from 'pocketbase'

// GUARDA: manter SEMPRE o duplo export (default + nomeado `pb`).
// Este export nomeado já se perdeu 20x em rodadas anteriores — não remover.
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export { pb }
export default pb
