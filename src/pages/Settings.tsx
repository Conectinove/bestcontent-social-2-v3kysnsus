import { useState } from 'react'
import { Settings as SettingsIcon, User, Sun, Moon, Shield, Link2, Check } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSocial } from '@/context/SocialContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'

export default function Settings() {
  const { user, updateProfile } = useAuth()
  const { theme, toggleTheme } = useSocial()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({ name, email })
    toast({ title: 'Perfil Atualizado', description: 'Suas informações foram salvas.' })
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          Configurações
          <SettingsIcon className="w-6 h-6 text-primary" />
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie seu perfil, temas, integrações e preferências de conta.
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="account" className="text-xs">
            Conta
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs">
            Aparência
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs">
            Integrações
          </TabsTrigger>
          <TabsTrigger value="about" className="text-xs">
            Sobre
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4">
          <Card className="p-6 max-w-md space-y-4">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Nome Completo</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">E-mail</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" className="bg-primary text-white text-xs">
                Salvar Alterações
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <Card className="p-6 max-w-md space-y-4">
            <h3 className="text-sm font-semibold">Tema da Interface</h3>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="text-xs font-medium">Modo Escuro / Claro</span>
              <Button size="sm" onClick={toggleTheme} className="text-xs bg-primary text-white">
                {theme === 'dark' ? 'Ativar Claro' : 'Ativar Escuro'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <Card className="p-6 space-y-3 max-w-lg">
            <h3 className="text-sm font-semibold">Redes Sociais Conectadas</h3>
            {['Instagram Graph API', 'TikTok Creator API', 'LinkedIn API'].map((net) => (
              <div
                key={net}
                className="flex items-center justify-between p-3 rounded-lg bg-muted text-xs"
              >
                <span>{net}</span>
                <span className="text-green-500 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Conectado
                </span>
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <Card className="p-6 max-w-md text-xs space-y-2">
            <h3 className="font-bold text-sm">BestContent Social 2</h3>
            <p className="text-muted-foreground">
              Versão 2.4.0 — PWA Habilitado com IA generativa.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
