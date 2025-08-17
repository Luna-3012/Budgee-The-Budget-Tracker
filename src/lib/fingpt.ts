interface FinancialContext {
  totalExpenses: number;
  monthlyExpenses: number;
  categoryBreakdown: Record<string, number>;
  recentTransactions: Array<{
    amount: number;
    category: string;
    description: string;
    date: Date;
  }>;
  trends: {
    monthlyChange: number;
    topCategories: string[];
  };
}

interface FinGPTResponse {
  generated_text: string;
}

class FinGPTService {
  private apiKey: string;
  private modelEndpoint = 'https://api-inference.huggingface.co/models/FinGPT/fingpt-mt_llama3-8b_lora';

  constructor() {
    this.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Hugging Face API key not found. FinGPT features will be limited.');
    }
  }

  private buildFinancialContext(expenses: any[]): FinancialContext {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate monthly expenses
    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const previousMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === previousMonth && expenseDate.getFullYear() === previousYear;
    });

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const currentMonthTotal = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const previousMonthTotal = previousMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Category breakdown
    const categoryBreakdown = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Top categories
    const topCategories = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    // Monthly change
    const monthlyChange = previousMonthTotal > 0 
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 
      : 0;

    return {
      totalExpenses,
      monthlyExpenses: currentMonthTotal,
      categoryBreakdown,
      recentTransactions: expenses.slice(0, 10).map(exp => ({
        amount: exp.amount,
        category: exp.category,
        description: exp.description,
        date: new Date(exp.date)
      })),
      trends: {
        monthlyChange,
        topCategories
      }
    };
  }

  private buildRAGPrompt(query: string, context: FinancialContext): string {
    const contextData = `
FINANCIAL CONTEXT:
- Total Expenses: ₹${context.totalExpenses.toFixed(2)}
- This Month: ₹${context.monthlyExpenses.toFixed(2)}
- Monthly Change: ${context.trends.monthlyChange.toFixed(1)}%
- Top Categories: ${context.trends.topCategories.join(', ')}

CATEGORY BREAKDOWN:
${Object.entries(context.categoryBreakdown)
  .map(([cat, amount]) => `- ${cat}: ₹${amount.toFixed(2)}`)
  .join('\n')}

RECENT TRANSACTIONS:
${context.recentTransactions.slice(0, 5)
  .map(t => `- ${t.category}: ₹${t.amount.toFixed(2)} (${t.description})`)
  .join('\n')}

USER QUERY: ${query}

Please provide specific, actionable financial advice based on the user's actual spending data above. Focus on:
1. Concrete recommendations based on their spending patterns
2. Specific areas where they can optimize expenses
3. Realistic budgeting suggestions
4. Trends analysis and insights

Response should be practical, personalized, and under 300 words:`;

    return contextData;
  }

  async queryFinGPT(query: string, expenses: any[]): Promise<string> {
    if (!this.apiKey) {
      return this.getFallbackResponse(query, expenses);
    }

    try {
      const context = this.buildFinancialContext(expenses);
      const prompt = this.buildRAGPrompt(query, context);

      const response = await fetch(this.modelEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 300,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (Array.isArray(result) && result.length > 0) {
        return result[0].generated_text || this.getFallbackResponse(query, expenses);
      }
      
      return this.getFallbackResponse(query, expenses);
    } catch (error) {
      console.error('FinGPT API error:', error);
      return this.getFallbackResponse(query, expenses);
    }
  }

  private getFallbackResponse(query: string, expenses: any[]): string {
    const context = this.buildFinancialContext(expenses);
    
    if (query.toLowerCase().includes('spend more') || query.toLowerCase().includes('increased')) {
      const difference = context.monthlyExpenses - (context.totalExpenses / 12);
      const percentageChange = context.trends.monthlyChange;
      
      if (difference > 0) {
        return `You spent ₹${difference.toFixed(2)} more this month compared to your average (${percentageChange.toFixed(1)}% increase). 

**Main reasons:**
• Your highest spending category is ${context.trends.topCategories[0]} with ₹${context.categoryBreakdown[context.trends.topCategories[0]]?.toFixed(2)}
• Recent increase in ${context.trends.topCategories.slice(0, 2).join(' and ')} expenses

**Recommendations:**
• Set weekly spending limits for ${context.trends.topCategories[0]}
• Track daily expenses to identify spending triggers
• Consider the 50/30/20 budgeting rule`;
      } else {
        return `Great news! You actually spent ₹${Math.abs(difference).toFixed(2)} less this month (${Math.abs(percentageChange).toFixed(1)}% decrease). Keep up the good financial discipline!`;
      }
    }

    if (query.toLowerCase().includes('cut costs') || query.toLowerCase().includes('save')) {
      return `**Personalized Cost-Cutting Suggestions:**

💡 **Top Savings Opportunities:**
• ${context.trends.topCategories[0]}: ₹${context.categoryBreakdown[context.trends.topCategories[0]]?.toFixed(2)} - Try meal planning, bulk buying, or finding alternatives
• ${context.trends.topCategories[1]}: ₹${context.categoryBreakdown[context.trends.topCategories[1]]?.toFixed(2)} - Look for discounts, compare prices, or reduce frequency

📊 **Budget Recommendations:**
• Set monthly limits: ${context.trends.topCategories[0]} (₹${(context.categoryBreakdown[context.trends.topCategories[0]] * 0.8)?.toFixed(2)}), ${context.trends.topCategories[1]} (₹${(context.categoryBreakdown[context.trends.topCategories[1]] * 0.8)?.toFixed(2)})
• Track daily expenses to stay aware of spending patterns
• Emergency fund goal: ₹${(context.monthlyExpenses * 6).toFixed(2)}`;
    }

    if (query.toLowerCase().includes('category') || query.toLowerCase().includes('increased most')) {
      return `📈 **Category Analysis:**

**Highest Spending Categories:**
${Object.entries(context.categoryBreakdown)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 3)
  .map(([cat, amount], index) => 
    `${index + 1}. ${cat}: ₹${amount.toFixed(2)} (${((amount / context.totalExpenses) * 100).toFixed(1)}%)`
  ).join('\n')}

**Recommendations:**
• Focus on optimizing your top spending category: ${context.trends.topCategories[0]}
• Consider if this allocation aligns with your financial priorities
• Set alerts when you exceed 70% of your category budget`;
    }

    return `**Financial Overview:**

💰 **Current Status:**
• Total expenses: ₹${context.totalExpenses.toFixed(2)}
• This month: ₹${context.monthlyExpenses.toFixed(2)}
• Monthly change: ${context.trends.monthlyChange.toFixed(1)}%
• Top category: ${context.trends.topCategories[0]}

**General Advice:**
• Review your spending weekly to stay on track
• Use expense tracking consistently
• Consider setting up automatic savings transfers
• Emergency fund goal: ₹${(context.monthlyExpenses * 6).toFixed(2)}`;
  }
}

export const finGPTService = new FinGPTService();