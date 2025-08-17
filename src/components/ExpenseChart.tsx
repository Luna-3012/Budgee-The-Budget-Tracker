import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card } from "@/components/ui/card";

interface ExpenseData {
  category: string;
  amount: number;
  icon: string;
  color: string;
}

interface ExpenseChartProps {
  data: ExpenseData[];
  totalAmount: number;
}

const COLORS = [
  'hsl(210 89% 35%)', // Primary blue
  'hsl(182 59% 43%)', // Secondary teal
  'hsl(79 59% 75%)',  // Accent green
  'hsl(0 84% 55%)',   // Destructive red
  'hsl(270 59% 55%)', // Purple
  'hsl(30 84% 55%)',  // Orange
  'hsl(150 59% 55%)', // Green
  'hsl(210 20% 45%)', // Gray
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card p-4 rounded-lg shadow-floating border border-border">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{data.icon}</span>
          <div>
            <p className="font-bold text-foreground">{data.category}</p>
            <p className="text-sm text-muted-foreground">
              {((data.amount / data.total) * 100).toFixed(1)}% of total
            </p>
          </div>
        </div>
        <p className="text-lg font-semibold text-primary">
          ₹{data.amount.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export const ExpenseChart = ({ data, totalAmount }: ExpenseChartProps) => {
  const chartData = data.map((item, index) => ({
    ...item,
    total: totalAmount,
    fill: COLORS[index % COLORS.length],
  }));

  if (data.length === 0) {
    return (
      <Card className="p-8 text-center bg-gradient-card">
        <div className="text-6xl mb-4">💰</div>
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No expenses yet</h3>
        <p className="text-sm text-muted-foreground">Start tracking your expenses to see the breakdown</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-card">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-foreground mb-2">Expense Breakdown</h3>
        <p className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          ₹{totalAmount.toFixed(2)}
        </p>
        <p className="text-sm text-muted-foreground">Total spent this period</p>
      </div>
      
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="amount"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              formatter={(value, entry: any) => (
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{entry.payload.icon}</span>
                  <span className="font-medium truncate">{entry.payload.category}</span>
                </span>
              )}
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '16px'
              }}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};