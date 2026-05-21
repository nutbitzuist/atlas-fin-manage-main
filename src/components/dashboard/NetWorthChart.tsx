import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";

interface NetWorthChartProps {
  data: Array<{ date: string; netWorth: number }>;
}

export const NetWorthChart = ({ data }: NetWorthChartProps) => {
  const { t } = useTranslation('dashboard');

  return (
    <Card className="col-span-full lg:col-span-2 shadow-md">
      <CardHeader>
        <CardTitle>{t('widgets.netWorthTrend')}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div className="w-full h-[320px] min-h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                className="text-xs text-muted-foreground"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                className="text-xs text-muted-foreground"
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number) => [
                  `฿${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                  t('widgets.netWorth')
                ]}
              />
              <Line
                type="monotone"
                dataKey="netWorth"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ fill: 'var(--primary)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
