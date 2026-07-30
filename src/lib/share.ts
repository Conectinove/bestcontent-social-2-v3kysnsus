import { toast } from '@/hooks/use-toast'

export async function sharePost(text: string, url?: string) {
  const shareUrl = url || window.location.origin
  if (navigator.share) {
    try {
      await navigator.share({ title: 'BestContent Social', text, url: shareUrl })
    } catch (_) {
      // User cancelled
    }
  } else {
    try {
      await navigator.clipboard.writeText(`${text}\n\n${shareUrl}`)
      toast({ title: 'Copiado!', description: 'Conteúdo copiado para a área de transferência.' })
    } catch (_) {
      toast({
        title: 'Erro',
        description: 'Não foi possível compartilhar.',
        variant: 'destructive',
      })
    }
  }
}
