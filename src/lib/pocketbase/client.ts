import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: manter o duplo export (default + nomeado) — o código do projeto importa
// dos dois jeitos (`import pb from ...` e `import { pb } from ...`).
// Este export nomeado já regrediu 22 vezes; NÃO remova.
export { pb }
export default pb
