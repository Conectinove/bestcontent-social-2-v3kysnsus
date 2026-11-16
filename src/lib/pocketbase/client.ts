import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// Guarda de regressão: client.ts perdeu o export nomeado `pb` em v0.0.179,
// v0.0.181, v0.0.188, v0.0.190, v0.0.221, v0.0.245, v0.0.246, v0.0.263 e
// v0.0.296 (24ª vez). NUNCA remover o export nomeado abaixo — a grade, o
// canvas e dezenas de serviços importam { pb }.
export { pb }
export default pb
