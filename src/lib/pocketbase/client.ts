import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDRAIL: este arquivo DEVE manter os DOIS exports (nomeado e default).
// Diversos arquivos importam { pb } e outros usam o default — remover qualquer
// um dos dois quebra o build com [MISSING_EXPORT].
export { pb }
export default pb
