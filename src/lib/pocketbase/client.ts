import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: manter SEMPRE o duplo export (default + nomeado `pb`).
// Perder o export nomeado quebra o build (regressão já ocorrida 17x neste projeto).
export default pb
export { pb as pb }
