import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// Requisito permanente do projeto: export duplo (nomeado + default).
// Vários arquivos importam { pb } (nomeado) e outros o default.
export { pb }
export default pb
