import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useTranslation } from "react-i18next";

interface AssetAllocationChartProps {
  data: Array<{ name: string; value: number }>;
}

type LegendEntry = {
  payload?: {
    value?: number;
  };
};

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export const AssetAllocationChart = ({ data }: AssetAllocationChartProps) => {
  const { t } = useTranslation('dashboard');

  return (
    <Card className="col-span-full lg:col-span-1 shadow-md">
      <CardHeader>
        <CardTitle>{t('widgets.assetAllocation')}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-hidden p-0">
        <div className="w-full h-[320px] min-h-[280px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={false}
                outerRadius={70}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                align="center"
                iconType="circle"
                wrapperStyle={{
                  paddingTop: '10px',
                  fontSize: '12px',
                }}
                formatter={(value: string, entry: LegendEntry) => {
                  const total = data.reduce((sum, item) => sum + item.value, 0);
                  const percent = total > 0 ? (((entry.payload?.value || 0) / total) * 100).toFixed(0) : "0";
                  return `${value.length > 20 ? value.substring(0, 18) + '...' : value} (${percent}%)`;
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number) => [
                  `฿${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                  t('widgets.value')
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
