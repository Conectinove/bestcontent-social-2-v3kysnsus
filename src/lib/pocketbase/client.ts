import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA DE REGRESSÃO (12+ ocorrências): este arquivo PRECISA manter o duplo
// export — default (usado pela maioria dos services) E nomeado { pb } (usado
// por imports como `import { pb } from '@/lib/pocketbase/client'`).
export { pb }
export default pb
