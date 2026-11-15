import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb
// GUARDA: não remover o export nomeado — regressão já aconteceu 18x
// (Library.tsx e PostCollaborationModal.tsx importam { pb } nomeado)
export { pb }
