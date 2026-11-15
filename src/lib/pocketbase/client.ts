import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// Duplo export: alguns arquivos importam { pb } (nomeado) e outros o default.
// NÃO remover nenhum dos dois — regressão recorrente (6x).
export { pb }
