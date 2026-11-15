import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)
pb.autoCancellation(false)

// GUARDA DE REGRESSÃO: manter SEMPRE o duplo export (default + nomeado).
// Componentes legados importam `import { pb } from '@/lib/pocketbase/client'`;
// removê-lo já quebrou o build 14 vezes (veja memória do projeto).
export default pb
export { pb }
