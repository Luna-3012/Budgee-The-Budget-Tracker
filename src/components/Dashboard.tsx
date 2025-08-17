import { useState, useMemo } from "react";
import { ExpenseChart } from "./ExpenseChart";
import { ExpenseCard } from "./ExpenseCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  icon: string;
}

interface DashboardProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}

export const Dashboard = ({ expenses, onDeleteExpense }: DashboardProps) => {
  const [timeFilter, setTimeFilter] = useState<"week" | "month" | "year">("month");

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      switch (timeFilter) {
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return expenseDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          return expenseDate >= monthAgo;
        case "year":
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          return expenseDate >= yearAgo;
        default:
          return true;
      }
    });
  }, [expenses, timeFilter]);

  const chartData = useMemo(() => {
    console.log('Processing chart data for expenses:', filteredExpenses); 
    
    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
      console.log('Processing expense for chart:', expense); 
      
      if (!acc[expense.category]) {
        acc[expense.category] = {
          category: expense.category,
          amount: 0,
          icon: expense.icon,
          color: "",
        };
      }
      acc[expense.category].amount += expense.amount;
      return acc;
    }, {} as Record<string, { category: string; amount: number; icon: string; color: string }>);

    const result = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);
    console.log('Chart data result:', result);
    return result;
  }, [filteredExpenses]);

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averageDaily = totalAmount / (timeFilter === "week" ? 7 : timeFilter === "month" ? 30 : 365);

  const previousPeriodExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      switch (timeFilter) {
        case "week":
          const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return expenseDate >= twoWeeksAgo && expenseDate < weekAgo;
        case "month":
          const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          return expenseDate >= twoMonthsAgo && expenseDate < monthAgo;
        case "year":
          const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          return expenseDate >= twoYearsAgo && expenseDate < yearAgo;
        default:
          return false;
      }
    });
  }, [expenses, timeFilter]);

  const previousTotal = previousPeriodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const changePercent = previousTotal > 0 ? ((totalAmount - previousTotal) / previousTotal) * 100 : 0;

  return (
    <div className="space-y-6 w-full">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="flex gap-2 flex-wrap">
          {(["week", "month", "year"] as const).map((period) => (
            <Button
              key={period}
              variant={timeFilter === period ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFilter(period)}
              className={cn(
                "capitalize transition-colors duration-200",
                timeFilter === period 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-[rgba(38,155,173,0.15)] hover:text-[#269bad] hover:border-[#269bad]"
              )}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-primary">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total This {timeFilter}</p>
              <p className="text-2xl font-bold text-foreground">₹{totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-secondary">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily Average</p>
              <p className="text-2xl font-bold text-foreground">₹{averageDaily.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-card">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${changePercent >= 0 ? 'bg-destructive' : 'bg-accent'}`}>
              {changePercent >= 0 ? (
                <TrendingUp className="h-6 w-6 text-white" />
              ) : (
                <TrendingDown className="h-6 w-6 text-accent-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">vs Previous</p>
              <p className={`text-2xl font-bold ${changePercent >= 0 ? 'text-destructive' : 'text-accent-foreground'}`}>
                {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart and Recent Transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ExpenseChart data={chartData} totalAmount={totalAmount} />
        
        <Card className="p-6 bg-gradient-card">
          <h3 className="text-xl font-semibold text-foreground mb-4">Recent Transactions</h3>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-2">
              {filteredExpenses.slice(0, 10).map((expense) => {
                console.log('Dashboard rendering expense:', expense); 
                return (
                  <ExpenseCard
                    key={expense.id}
                    id={expense.id}
                    amount={expense.amount}
                    category={expense.category}
                    description={expense.description}
                    date={expense.date}
                    icon={expense.icon}
                    onDelete={onDeleteExpense}
                  />
                );
              })}
              {filteredExpenses.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-muted-foreground">No expenses in this period</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};
