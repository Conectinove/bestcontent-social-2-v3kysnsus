import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb
// GUARDA: manter SEMPRE o duplo export (default + nomeado). Este export nomeado
// já regrediu ~20 vezes e derruba o build — não remover.
export { pb }
