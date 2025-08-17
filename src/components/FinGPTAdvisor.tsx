import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Loader2, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  icon: string;
  user_id?: string;
}

interface FinGPTAdvisorProps {
  expenses: Expense[];
}

export const FinGPTAdvisor = ({ expenses }: FinGPTAdvisorProps) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const quickQuestions = [
    {
      icon: TrendingUp,
      question: "Why did I spend more this month?",
      color: "text-red-500"
    },
    {
      icon: TrendingDown,
      question: "Suggest ways to cut costs.",
      color: "text-green-500"
    },
    {
      icon: PieChart,
      question: "Which category increased the most?",
      color: "text-blue-500"
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setIsLoading(true);
    setAnswer("");

    try {
      // Format expenses data for backend compatibility
      const formattedExpenses = expenses.map(expense => ({
        ...expense,
        date: expense.date instanceof Date ? expense.date.toISOString() : expense.date,
        user_id: expense.user_id || 'default_user' 
      }));

      const response = await fetch("http://localhost:8000/api/query-fingpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, expenses: formattedExpenses }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        setAnswer("");
      } else {
        setAnswer(data.answer || "No answer returned.");
        toast({
          title: "Analysis Complete",
          description: "AI-powered financial advice generated",
        });
      }
    } catch (error: any) {
        console.error("FinGPT query error:", error);
        
        let errorMessage = "Failed to get AI analysis. Please try again.";
        if (error.message?.includes('Failed to fetch')) {
          errorMessage = "Cannot connect to the AI service. Please check if the backend is running.";
        } else if (error.message?.includes('500')) {
          errorMessage = "Server error occurred. Please try again later.";
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        setAnswer("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (quickQ: string) => {
    setQuestion(quickQ);
    setAnswer("");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-card shadow-card">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          BudgeeBot - Your AI Financial Advisor</h2>

          <div className="space-y-6">
          <div className="flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full">
              {quickQuestions.map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-3 text-center justify-center border-muted hover:bg-muted/50 min-h-[60px] flex items-center space-x-2"
                  onClick={() => handleQuickQuestion(item.question)}
                >
                  <item.icon className={`h-5 w-5 ${item.color} flex-shrink-0`} />
                  <span className="text-sm font-medium leading-tight">{item.question}</span>
                </Button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask BudgeeBot about your spending habits, budgeting tips, or financial insights..."
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          {answer && (
            <Card className="p-4 bg-muted/30 border-muted">
              <div className="flex items-start gap-3">
                <Bot className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-foreground mb-2">AI Analysis</h3>
                  <Textarea
                    value={answer}
                    readOnly
                    className="min-h-[250px] resize-none bg-transparent border-none p-0 text-sm leading-relaxed whitespace-pre-wrap"
                  />
                </div>
              </div>
            </Card>
          )}

          {expenses.length === 0 && (
            <Card className="p-6 text-center bg-muted/20 border-muted">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Add some expenses first to get AI-powered personalized financial insights and advice from FinGPT!
              </p>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
};
