import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: manter o DUPLO EXPORT (default + nomeado) — o export nomeado `pb`
// já regrediu 20x e quebra o build inteiro ("pb is not exported").
export default pb
export { pb }
