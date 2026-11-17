import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA — duplo export obrigatório: os imports nomeados (`import { pb } from ...`)
// já quebraram 27× quando alguém removeu um dos exports. NUNCA remova uma das formas.
export { pb }
export default pb
