import pb from '@/lib/pocketbase/client'

export interface WaitlistPayload {
  name: string
  email: string
  business_handle?: string
  profile_type?: string
  plan_interest?: string
}

export const createWaitlistEntry = async (payload: WaitlistPayload) => {
  return await pb.collection('waitlist').create(payload)
}
