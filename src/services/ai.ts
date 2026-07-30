import pb from '@/lib/pocketbase/client'

export const generateCaption = (content: string, platform: string) =>
  pb.send('/backend/v1/ai/caption', {
    method: 'POST',
    body: JSON.stringify({ content, platform }),
    headers: { 'Content-Type': 'application/json' },
  })

export const generateHashtags = (content: string) =>
  pb.send('/backend/v1/ai/hashtags', {
    method: 'POST',
    body: JSON.stringify({ content }),
    headers: { 'Content-Type': 'application/json' },
  })

export const improveText = (content: string) =>
  pb.send('/backend/v1/ai/improve', {
    method: 'POST',
    body: JSON.stringify({ content }),
    headers: { 'Content-Type': 'application/json' },
  })

export const generateVideoScript = (data: {
  prompt: string
  duration: number
  brandName?: string
  objective?: string
}) =>
  pb.send('/backend/v1/ai/script', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
