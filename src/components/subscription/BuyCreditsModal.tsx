import React from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Shield, Sparkles, Zap, MessageSquare, Volume2, Check } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export interface CreditPackage {
  id: string
  credits: number
  formattedCredits: string
  postsCount: number
  price: string
  badge?: {
    text: string
    variant: 'dark' | 'purple' | 'gold'
  }
  discountPill?: {
    text: string
    variant: 'blue' | 'purple' | 'green' | 'orange' | 'red'
  }
  isPopular?: boolean
  isKing?: boolean
  buttonVariant?: 'default' | 'gold'
  buttonText?: string
  coinsCount: number
  pedestalColor: string
}

const PACKAGES: CreditPackage[] = [
  {
    id: 'pkg-185',
    credits: 185,
    formattedCredits: '185',
    postsCount: 18,
    price: 'R$ 22,90',
    badge: {
      text: '🏅 MAIS BARATO',
      variant: 'dark',
    },
    buttonText: 'Comprar',
    coinsCount: 1,
    pedestalColor: '#1d4ed8', // blue pedestal
  },
  {
    id: 'pkg-380',
    credits: 380,
    formattedCredits: '380',
    postsCount: 38,
    price: 'R$ 44,90',
    discountPill: {
      text: '🎁 Economize 10%',
      variant: 'blue',
    },
    buttonText: 'Comprar',
    coinsCount: 2,
    pedestalColor: '#2563eb',
  },
  {
    id: 'pkg-815',
    credits: 815,
    formattedCredits: '815',
    postsCount: 81,
    price: 'R$ 74,90',
    badge: {
      text: '🔥 MAIS POPULAR',
      variant: 'purple',
    },
    discountPill: {
      text: 'Economize 17%',
      variant: 'purple',
    },
    isPopular: true,
    buttonText: 'Comprar agora ›',
    coinsCount: 3,
    pedestalColor: '#7c3aed', // purple pedestal
  },
  {
    id: 'pkg-1650',
    credits: 1650,
    formattedCredits: '1.650',
    postsCount: 165,
    price: 'R$ 134,90',
    discountPill: {
      text: 'Economize 25%',
      variant: 'green',
    },
    buttonText: 'Comprar',
    coinsCount: 4,
    pedestalColor: '#0d9488', // teal pedestal
  },
  {
    id: 'pkg-3350',
    credits: 3350,
    formattedCredits: '3.350',
    postsCount: 335,
    price: 'R$ 279,90',
    discountPill: {
      text: 'Economize 33%',
      variant: 'orange',
    },
    buttonText: 'Comprar',
    coinsCount: 5,
    pedestalColor: '#d97706', // gold/amber pedestal
  },
  {
    id: 'pkg-6800',
    credits: 6800,
    formattedCredits: '6.800',
    postsCount: 680,
    price: 'R$ 519,90',
    badge: {
      text: '🏆 REI DOS CRÉDITOS',
      variant: 'gold',
    },
    discountPill: {
      text: 'Economize 38%',
      variant: 'red',
    },
    isKing: true,
    buttonVariant: 'gold',
    buttonText: 'Comprar',
    coinsCount: 7,
    pedestalColor: '#b91c1c', // rich ruby-gold base
  },
]

// Stylized visual coin illustration for each package to match the 3D coin rendering
function CoinIllustration({
  coinsCount,
  pedestalColor,
  isKing,
}: {
  coinsCount: number
  pedestalColor: string
  isKing?: boolean
}) {
  return (
    <div className="relative w-28 h-24 flex items-center justify-center select-none">
      {/* Background glow */}
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-35"
        style={{ backgroundColor: isKing ? '#f59e0b' : pedestalColor }}
      />

      {/* Sparkles around */}
      <span className="absolute top-1 left-2 text-[10px] animate-pulse">✨</span>
      <span className="absolute bottom-3 right-1 text-[8px] opacity-70">✦</span>
      {isKing && <span className="absolute top-0 right-3 text-[10px] text-amber-300">👑</span>}

      {/* 3D Circular Pedestal */}
      <div className="absolute bottom-1 w-24 h-7 rounded-[50%] shadow-md transform transition-transform">
        {/* Pedestal rim */}
        <div
          className="w-full h-full rounded-[50%] border-2 border-white/20 shadow-inner"
          style={{
            background: `radial-gradient(ellipse at 50% 30%, ${pedestalColor}ee, ${pedestalColor}aa 60%, #0f172a 100%)`,
            boxShadow: `0 8px 18px ${pedestalColor}44, inset 0 2px 4px rgba(255,255,255,0.4)`,
          }}
        />
        {/* Inner concentric ring */}
        <div className="absolute inset-1 rounded-[50%] border border-white/30 opacity-70" />
      </div>

      {/* Golden Coins Stack */}
      <div className="relative z-10 flex flex-col items-center -translate-y-1">
        {coinsCount === 1 && (
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 shadow-xl border-2 border-amber-200/80 flex items-center justify-center transform hover:rotate-6 transition-transform">
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-amber-100/70 flex items-center justify-center bg-gradient-to-br from-amber-400 to-yellow-500">
              <span className="text-amber-950 font-black text-sm">BC</span>
            </div>
          </div>
        )}

        {coinsCount === 2 && (
          <div className="relative w-16 h-14">
            <div className="absolute left-0 bottom-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 shadow-lg border-2 border-amber-200/80 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border border-amber-100/70 flex items-center justify-center bg-yellow-400">
                <span className="text-amber-950 font-bold text-[10px]">BC</span>
              </div>
            </div>
            <div className="absolute right-0 top-0 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500 shadow-xl border-2 border-amber-100 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border border-amber-100/70 flex items-center justify-center bg-yellow-400">
                <span className="text-amber-950 font-bold text-[10px]">BC</span>
              </div>
            </div>
          </div>
        )}

        {coinsCount === 3 && (
          <div className="relative w-18 h-14">
            <div className="absolute left-0 bottom-0 w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-md border-2 border-amber-200 flex items-center justify-center">
              <span className="text-amber-950 font-bold text-[9px]">BC</span>
            </div>
            <div className="absolute right-0 bottom-0 w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-md border-2 border-amber-200 flex items-center justify-center">
              <span className="text-amber-950 font-bold text-[9px]">BC</span>
            </div>
            <div className="absolute left-3.5 -top-1 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500 shadow-xl border-2 border-amber-100 flex items-center justify-center z-10">
              <span className="text-amber-950 font-black text-xs">BC</span>
            </div>
          </div>
        )}

        {coinsCount === 4 && (
          <div className="relative w-18 h-14 flex flex-col items-center">
            {/* Stack of 4 */}
            <div className="space-y-[-18px] flex flex-col items-center">
              <div className="w-12 h-4 rounded-[50%] bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-500 shadow-sm border border-amber-200" />
              <div className="w-12 h-4 rounded-[50%] bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-500 shadow-sm border border-amber-200" />
              <div className="w-12 h-4 rounded-[50%] bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-500 shadow-sm border border-amber-200" />
              <div className="w-12 h-6 rounded-[50%] bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500 shadow-lg border-2 border-amber-100 flex items-center justify-center">
                <span className="text-amber-950 font-black text-[9px] -translate-y-0.5">BC</span>
              </div>
            </div>
          </div>
        )}

        {coinsCount === 5 && (
          <div className="relative w-20 h-15 flex flex-col items-center">
            <div className="space-y-[-16px] flex flex-col items-center">
              <div className="w-14 h-4 rounded-[50%] bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-500 shadow-sm border border-amber-200" />
              <div className="w-14 h-4 rounded-[50%] bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-500 shadow-sm border border-amber-200" />
              <div className="w-14 h-4 rounded-[50%] bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-500 shadow-sm border border-amber-200" />
              <div className="w-14 h-4 rounded-[50%] bg-gradient-to-r from-amber-600 via-yellow-300 to-amber-500 shadow-sm border border-amber-200" />
              <div className="w-14 h-6 rounded-[50%] bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500 shadow-xl border-2 border-amber-100 flex items-center justify-center">
                <span className="text-amber-950 font-black text-[10px] -translate-y-0.5">BC</span>
              </div>
            </div>
          </div>
        )}

        {coinsCount >= 7 && (
          <div className="relative w-20 h-16 flex items-center justify-center">
            {/* Pyramid/treasure stack with crown */}
            <div className="relative">
              {/* Bottom tier */}
              <div className="flex gap-1 items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-400 border border-amber-200 shadow-sm" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-400 border border-amber-200 shadow-sm" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-400 border border-amber-200 shadow-sm" />
              </div>
              {/* Mid tier */}
              <div className="flex gap-1 items-center justify-center -mt-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 border border-amber-100 shadow-md" />
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 border border-amber-100 shadow-md" />
              </div>
              {/* Center crest coin */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-100 via-yellow-300 to-amber-500 border-2 border-amber-200 shadow-xl mx-auto -mt-4 flex items-center justify-center">
                <span className="text-amber-950 text-xs">👑</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface BuyCreditsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBuyCredits?: (amount: number) => void
}

export function BuyCreditsModal({ open, onOpenChange, onBuyCredits }: BuyCreditsModalProps) {
  const handleBuy = (pkg: CreditPackage) => {
    if (onBuyCredits) {
      onBuyCredits(pkg.credits)
    }
    toast({
      title: 'Pedido iniciado!',
      description: `Você selecionou ${pkg.formattedCredits} créditos por ${pkg.price}. Redirecionando para o checkout seguro...`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-3xl bg-background border border-border/80 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
          <div>
            <DialogTitle className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Impulsione sua produtividade
            </DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <span>✨</span>
              <span>Mais barato que pagar alguém, mais rápido que fazer sozinho.</span>
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
            <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Compra 100% segura</span>
          </div>
        </div>

        {/* 3x2 Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {PACKAGES.map((pkg) => {
            const isPopular = pkg.isPopular
            const isKing = pkg.isKing

            return (
              <div
                key={pkg.id}
                className={`relative rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 border bg-card ${
                  isPopular
                    ? 'border-purple-500 shadow-md ring-1 ring-purple-500/30'
                    : isKing
                      ? 'border-amber-400/90 shadow-md ring-1 ring-amber-400/30'
                      : 'border-border/80 hover:border-primary/40 shadow-xs'
                }`}
              >
                {/* Top Badge (Mais Barato / Mais Popular / Rei dos Créditos) */}
                {pkg.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide shadow-sm ${
                        pkg.badge.variant === 'dark'
                          ? 'bg-neutral-800 text-white'
                          : pkg.badge.variant === 'purple'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950'
                      }`}
                    >
                      {pkg.badge.text}
                    </span>
                  </div>
                )}

                {/* Top card content: Coin + Credits info */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <CoinIllustration
                    coinsCount={pkg.coinsCount}
                    pedestalColor={pkg.pedestalColor}
                    isKing={isKing}
                  />

                  <div className="flex-1 flex flex-col items-end text-right">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                        {pkg.formattedCredits}
                      </span>
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        CRÉDITOS
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground mt-1">
                      <MessageSquare className="w-3 h-3 text-muted-foreground" />
                      <span>~{pkg.postsCount} posts</span>
                    </div>

                    {pkg.discountPill && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1.5 ${
                          pkg.discountPill.variant === 'blue'
                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                            : pkg.discountPill.variant === 'purple'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                              : pkg.discountPill.variant === 'green'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : pkg.discountPill.variant === 'orange'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {pkg.discountPill.text}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom line: Price + Buy Button */}
                <div className="flex items-center justify-between pt-4 mt-3 border-t border-border/40">
                  <span className="text-lg sm:text-xl font-black text-foreground">{pkg.price}</span>

                  <Button
                    size="sm"
                    onClick={() => handleBuy(pkg)}
                    className={`font-bold text-xs h-9 px-4 rounded-xl shadow-xs transition-all ${
                      isKing
                        ? 'bg-amber-500 hover:bg-amber-600 text-amber-950 font-black'
                        : isPopular
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {pkg.buttonText || 'Comprar'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Trust/Benefits Strip */}
        <div className="mt-6 pt-5 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 fill-amber-500/20" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Cada post consome</p>
              <p className="text-[11px] text-muted-foreground">~10 créditos</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Sem mensalidades</p>
              <p className="text-[11px] text-muted-foreground">Pague apenas pelo que usar.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Use como quiser</p>
              <p className="text-[11px] text-muted-foreground">Posts, artigos, imagens e +</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Overlapping avatars */}
            <div className="flex -space-x-2 shrink-0">
              <img
                src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=21"
                alt="Usuário"
                className="w-7 h-7 rounded-full ring-2 ring-background object-cover"
              />
              <img
                src="https://img.usecurling.com/ppl/thumbnail?gender=male&seed=44"
                alt="Usuário"
                className="w-7 h-7 rounded-full ring-2 ring-background object-cover"
              />
              <img
                src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=88"
                alt="Usuário"
                className="w-7 h-7 rounded-full ring-2 ring-background object-cover"
              />
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold text-[9px] flex items-center justify-center ring-2 ring-background">
                +
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>+326 pessoas</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </p>
              <p className="text-[11px] text-muted-foreground">nas últimas 24h</p>
            </div>
          </div>
        </div>

        {/* Modal Close Button */}
        <div className="pt-4 flex justify-center">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold px-6"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
