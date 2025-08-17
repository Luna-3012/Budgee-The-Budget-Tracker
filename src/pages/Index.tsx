import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/components/Dashboard";
import { FinGPTAdvisor } from "@/components/FinGPTAdvisor";
import { AuthForm } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { PlusCircle, BarChart3, Wallet, Bot, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useExpenses } from "@/hooks/useExpenses";
import { AddExpenseForm } from "@/components/AddExpenseForm";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, loading: authLoading, signOut } = useAuth();
  const { expenses, loading: expensesLoading, addExpense, deleteExpense } = useExpenses();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="p-3 rounded-full bg-gradient-primary mb-4 inline-block">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!user) {
    return <AuthForm />;
  }

  const totalBalance = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-white shadow-floating">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/20">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Budgee</h1>
                <p className="text-white/80">Manage your budget with ease</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80">Total Spent</p>
              <p className="text-3xl font-bold">₹{totalBalance.toFixed(2)}</p>
              <div className="mt-2">
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-card shadow-card">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="add-expense"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
            >
              <PlusCircle className="h-4 w-4" />
              Add Expense
            </TabsTrigger>
            <TabsTrigger 
              value="advisor"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white"
            >
              <Bot className="h-4 w-4" />
              BudgeeBot
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 w-full">
            <Dashboard 
              expenses={expenses} 
              onDeleteExpense={deleteExpense}
            />
          </TabsContent>

          <TabsContent value="add-expense" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <AddExpenseForm onAddExpense={addExpense} />
              
              {/* Quick Add Button for mobile */}
              <div className="mt-6 text-center">
                <Button
                  onClick={() => setActiveTab("dashboard")}
                  variant="outline"
                  className="border-primary hover:bg-primary/10"
                >
                  View Dashboard
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advisor" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <FinGPTAdvisor expenses={expenses} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Action Button for mobile */}
      {activeTab === "dashboard" && (
        <Button
          onClick={() => setActiveTab("add-expense")}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-primary shadow-floating hover:opacity-90 transition-opacity z-50"
          size="icon"
        >
          <PlusCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default Index;