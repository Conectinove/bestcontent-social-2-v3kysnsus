import pb from '@/lib/pocketbase/client'
import type { SocialAccountRecord } from '@/types'

export const getSocialAccounts = (userId: string) =>
  pb.collection<SocialAccountRecord>('social_accounts').getFullList({
    filter: `user = "${userId}"`,
  })

export const createSocialAccount = (data: Partial<SocialAccountRecord>) =>
  pb.collection<SocialAccountRecord>('social_accounts').create(data)

export const updateSocialAccount = (id: string, data: Partial<SocialAccountRecord>) =>
  pb.collection<SocialAccountRecord>('social_accounts').update(id, data)

export const deleteSocialAccount = (id: string) =>
  pb.collection<SocialAccountRecord>('social_accounts').delete(id)
