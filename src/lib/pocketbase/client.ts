import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

export default pb

// GUARDA: manter também o export nomeado pb — já foi a 23ª regressão do projeto
export { pb }
