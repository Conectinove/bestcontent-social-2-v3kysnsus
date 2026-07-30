import { ChartContainer } from '@/components/ui/chart'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

interface FollowerChartProps {
  data: Array<{ date: string; followers: number }>
}

export function FollowerChart({ data }: FollowerChartProps) {
  const chartConfig = {
    followers: {
      label: 'Seguidores',
      color: 'hsl(var(--primary))',
    },
  }

  const minVal = Math.min(...data.map((d) => d.followers)) - 10
  const maxVal = Math.max(...data.map((d) => d.followers)) + 10

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-4 shadow-xs">
      <div>
        <h3 className="text-base font-bold tracking-tight">Evolução de seguidores</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Snapshot diário coletado pelo BestContent
        </p>
      </div>

      <div className="h-64 w-full pt-2">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                style={{ fontSize: '11px', fill: '#888' }}
              />
              <YAxis
                domain={[minVal, maxVal]}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                style={{ fontSize: '11px', fill: '#888' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-2.5 text-xs shadow-lg space-y-0.5 border border-slate-800">
                        <p className="text-slate-400 text-[10px]">{payload[0].payload.date}</p>
                        <p className="font-bold text-sm text-pink-400">
                          {Number(payload[0].value).toLocaleString('pt-BR')} seguidores
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="followers"
                stroke="#ec4899"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: '#ec4899', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#ec4899', strokeWidth: 2, stroke: '#ffffff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>31 dias de histórico no período</span>
      </div>
    </div>
  )
}
