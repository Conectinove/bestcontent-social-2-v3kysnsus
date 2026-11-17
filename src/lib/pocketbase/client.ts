import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA (26 regressões): manter o DUPLO EXPORT — import default E nomeado `pb`.
// Alguns arquivos importam { pb }, outros o default; remover um dos dois quebra o build.
export { pb }
export default pb
