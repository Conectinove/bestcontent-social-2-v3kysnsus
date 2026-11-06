import { useState, useEffect, useMemo } from 'react'
import {
  CrmContact,
  CrmContactFormData,
  CrmStage,
  CRM_STAGE_LABELS,
  CRM_STAGE_COLORS,
  CRM_SOURCES,
} from '@/services/crm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, User, Building, Mail, Phone, DollarSign } from 'lucide-react'

interface CrmContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact?: CrmContact | null
  onSave: (data: CrmContactFormData) => Promise<void>
}

export function CrmContactModal({ open, onOpenChange, contact, onSave }: CrmContactModalProps) {
  const [formData, setFormData] = useState<CrmContactFormData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    source: 'Instagram',
    stage: 'lead_captado',
    value: 0,
    priority: 'media',
    responsible: 'Ronaldo Barreto',
    notes: '',
    custom_fields: {},
    tags: [],
  })

  const [customKey, setCustomKey] = useState('')
  const [customVal, setCustomVal] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (contact) {
      const parsedFields =
        contact.custom_fields && typeof contact.custom_fields === 'object'
          ? (contact.custom_fields as Record<string, string>)
          : {}
      const parsedTags = Array.isArray(contact.tags)
        ? contact.tags
        : typeof contact.tags === 'string'
          ? contact.tags.split(',').map((t) => t.trim())
          : []

      setFormData({
        name: contact.name || '',
        company: contact.company || '',
        email: contact.email || '',
        phone: contact.phone || '',
        source: contact.source || 'Instagram',
        stage: contact.stage || 'lead_captado',
        value: contact.value || 0,
        priority: contact.priority || 'media',
        responsible: contact.responsible || 'Ronaldo Barreto',
        notes: contact.notes || '',
        custom_fields: parsedFields,
        tags: parsedTags,
      })
    } else {
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        source: 'Instagram',
        stage: 'lead_captado',
        value: 0,
        priority: 'media',
        responsible: 'Ronaldo Barreto',
        notes: '',
        custom_fields: {},
        tags: [],
      })
    }
  }, [contact, open])

  const handleAddCustomField = () => {
    if (!customKey.trim() || !customVal.trim()) return
    setFormData((prev) => ({
      ...prev,
      custom_fields: {
        ...(prev.custom_fields || {}),
        [customKey.trim()]: customVal.trim(),
      },
    }))
    setCustomKey('')
    setCustomVal('')
  }

  const handleRemoveCustomField = (key: string) => {
    setFormData((prev) => {
      const nextFields = { ...(prev.custom_fields || {}) }
      delete nextFields[key]
      return { ...prev, custom_fields: nextFields }
    })
  }

  const handleAddTag = () => {
    if (!tagInput.trim()) return
    const newTag = tagInput.trim()
    if (!formData.tags?.includes(newTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag],
      }))
    }
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tag),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmitting(true)
    try {
      await onSave(formData)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <User className="w-5 h-5" />
            </span>
            {contact ? 'Editar Contato do CRM' : 'Novo Contato / Lead no CRM'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Dados Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" /> Nome do Lead *
              </Label>
              <Input
                required
                placeholder="Ex: Carolina Ribeiro"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-background/60"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-muted-foreground" /> Empresa / Projeto
              </Label>
              <Input
                placeholder="Ex: Lumina Estética"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="bg-background/60"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email de Contato
              </Label>
              <Input
                type="email"
                placeholder="lead@empresa.com.br"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-background/60"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" /> WhatsApp / Telefone
              </Label>
              <Input
                placeholder="(11) 98765-4321"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-background/60"
              />
            </div>
          </div>

          {/* Estágio, Origem e Valor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 rounded-xl bg-muted/40 border border-border/50">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Estágio do Funil *</Label>
              <Select
                value={formData.stage}
                onValueChange={(val) => setFormData({ ...formData, stage: val as CrmStage })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o estágio" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CRM_STAGE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Canal / Origem</Label>
              <Select
                value={formData.source}
                onValueChange={(val) => setFormData({ ...formData, source: val as any })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Origem do lead" />
                </SelectTrigger>
                <SelectContent>
                  {CRM_SOURCES.map((src) => (
                    <SelectItem key={src} value={src}>
                      {src}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Valor Estimado (R$)
              </Label>
              <Input
                type="number"
                min="0"
                step="50"
                value={formData.value || 0}
                onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                className="bg-background"
              />
            </div>
          </div>

          {/* Prioridade e Responsável */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Prioridade</Label>
              <Select
                value={formData.priority || 'media'}
                onValueChange={(val: any) => setFormData({ ...formData, priority: val })}
              >
                <SelectTrigger className="bg-background/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta 🔥</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Responsável na Agência</Label>
              <Input
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                placeholder="Ex: Ronaldo Barreto"
                className="bg-background/60"
              />
            </div>
          </div>

          {/* Campos Personalizados */}
          <div className="space-y-2 p-3 rounded-xl border border-border/60 bg-card/60">
            <Label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Campos Personalizados (Metadados do Lead)</span>
              <span className="text-[10px] text-muted-foreground uppercase font-normal">
                Flexível
              </span>
            </Label>

            {/* Lista dos campos já cadastrados */}
            <div className="space-y-1.5">
              {Object.entries(formData.custom_fields || {}).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-muted text-xs"
                >
                  <span className="font-semibold text-primary">{k}:</span>
                  <span className="truncate max-w-[240px] text-muted-foreground">{v}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomField(k)}
                    className="p-1 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Inserção de novo campo personalizado */}
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Campo (ex: Instagram)"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="text-xs h-8 bg-background"
              />
              <Input
                placeholder="Valor (ex: @clinica)"
                value={customVal}
                onChange={(e) => setCustomVal(e.target.value)}
                className="text-xs h-8 bg-background"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomField}
                className="h-8 shrink-0 gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Tags & Segmentação</Label>
            <div className="flex flex-wrap gap-1.5">
              {formData.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: VIP, Meta Ads, B2B..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                className="text-xs h-8 bg-background/60"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                className="h-8 text-xs shrink-0"
              >
                Adicionar Tag
              </Button>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Notas e Observações</Label>
            <Textarea
              rows={3}
              placeholder="Histórico prévio, expectativas do cliente, objeções levantadas..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-background/60 text-xs"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="hi-button bg-primary text-primary-foreground font-bold"
            >
              {isSubmitting ? 'Salvando...' : contact ? 'Atualizar Contato' : 'Cadastrar Contato'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
