import pb from '@/lib/pocketbase/client'
import type { UserIntegrationRecord, IntegrationNetwork } from '@/types'

export const getUserIntegrations = async (userId: string): Promise<UserIntegrationRecord[]> => {
  return pb.collection<UserIntegrationRecord>('user_integrations').getFullList({
    filter: `user = "${userId}"`,
    sort: 'created',
  })
}

export const createOrUpdateIntegration = async (
  userId: string,
  network: IntegrationNetwork,
  data: Partial<UserIntegrationRecord>,
): Promise<UserIntegrationRecord> => {
  try {
    const existing = await pb
      .collection<UserIntegrationRecord>('user_integrations')
      .getFirstListItem(`user = "${userId}" && network = "${network}"`)

    return await pb.collection<UserIntegrationRecord>('user_integrations').update(existing.id, data)
  } catch {
    return await pb.collection<UserIntegrationRecord>('user_integrations').create({
      user: userId,
      network,
      ...data,
    })
  }
}

export const toggleIntegrationStatus = async (
  userId: string,
  network: IntegrationNetwork,
  connected: boolean,
  displayName?: string,
): Promise<UserIntegrationRecord> => {
  const payload: Partial<UserIntegrationRecord> = {
    connected,
    connected_at: connected ? new Date().toISOString() : '',
  }
  if (displayName) {
    payload.display_name = displayName
  }
  return createOrUpdateIntegration(userId, network, payload)
}
