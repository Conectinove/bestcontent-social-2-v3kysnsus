import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA: manter SEMPRE o duplo export (default + nomeado). Este export nomeado
// já foi removido acidentalmente 15 vezes (v0.0.179, 181, 188, 190, 211, 221,
// 245, 246 e outras) quebrando todos os `import { pb } from ...` do projeto.
// Não remova a linha abaixo.
export { pb }
export default pb
