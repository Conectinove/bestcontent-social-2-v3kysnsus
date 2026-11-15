import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA (15ª regressão v0.0.250): NUNCA remover o export nomeado `pb`.
// Vários arquivos importam { pb } — remover este export quebra o build.
export { pb }
export default pb
