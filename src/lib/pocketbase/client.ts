import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA (regressão 28×): manter o DUPLO EXPORT — default e nomeado.
// Nunca remover `export { pb }` nem `export default pb` deste arquivo.
export { pb }
export default pb
