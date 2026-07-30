import pb from '@/lib/pocketbase/client'

export interface StructuredPostData {
  goal: string
  layout: string
  headline: string
  body: string
  offer: string
  cta: string
  footer: string
}

export const sendSocialStudioChat = (message: string, conversationId?: string | null) =>
  pb.send<{
    conversation_id: string
    content: string
    message_id: string
    citations?: any[]
  }>('/backend/v1/social-studio/chat', {
    method: 'POST',
    body: JSON.stringify({ message, conversation_id: conversationId }),
    headers: { 'Content-Type': 'application/json' },
  })

export const generateStructuredPost = (topic: string, approach: string) =>
  pb.send<StructuredPostData>('/backend/v1/social-studio/generate-structure', {
    method: 'POST',
    body: JSON.stringify({ topic, approach }),
    headers: { 'Content-Type': 'application/json' },
  })
