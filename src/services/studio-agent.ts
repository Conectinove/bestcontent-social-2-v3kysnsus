// Cliente do agente nativo Studio (slug: studio-agent) — rota fina do hook
// pocketbase/hooks/studio_agent.js, mesmo padrão de social_studio.ts.
import pb from '@/lib/pocketbase/client'

export interface StudioAgentChatResult {
  conversation_id: string
  content: string
  message_id: string
  citations?: unknown[]
}

export const sendStudioAgentChat = (message: string, conversationId?: string | null) =>
  pb.send<StudioAgentChatResult>('/backend/v1/studio-agent/chat', {
    method: 'POST',
    body: JSON.stringify({ message, conversation_id: conversationId }),
    headers: { 'Content-Type': 'application/json' },
  })
