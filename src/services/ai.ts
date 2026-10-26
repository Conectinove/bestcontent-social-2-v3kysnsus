import pb from '@/lib/pocketbase/client'

export interface CaptionVariation {
  title: string
  text: string
  cta?: string
}

export interface GenerateCaptionOptions {
  content: string
  platform?: string
  objective?: string
  approach?: string
  brandName?: string
  brandVoice?: string
  formatName?: string
  headline?: string
  variations?: boolean
}

export const generateCaption = (
  contentOrOptions: string | GenerateCaptionOptions,
  legacyPlatform?: string,
) => {
  const payload =
    typeof contentOrOptions === 'string'
      ? { content: contentOrOptions, platform: legacyPlatform || 'Instagram' }
      : contentOrOptions

  return pb.send('/backend/v1/ai/caption', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}

export interface GenerateHashtagsOptions {
  content: string
  platform?: string
  objective?: string
  category?: string
}

export const generateHashtags = (
  contentOrOptions: string | GenerateHashtagsOptions,
  legacyPlatform?: string,
) => {
  const payload =
    typeof contentOrOptions === 'string'
      ? { content: contentOrOptions, platform: legacyPlatform }
      : contentOrOptions

  return pb.send('/backend/v1/ai/hashtags', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
}

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
