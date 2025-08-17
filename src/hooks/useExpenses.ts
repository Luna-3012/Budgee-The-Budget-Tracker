import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useToast } from './use-toast'

export interface Expense {
  id: string
  amount: number
  category: string
  description: string
  date: Date
  icon: string
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  // Fetch expenses from Supabase
  const fetchExpenses = async () => {
    if (!user) {
      setExpenses([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('Raw expenses from database:', data); 
      
      const formattedExpenses: Expense[] = data.map(expense => {
        console.log('Processing expense:', expense); 
        return {
          id: expense.id,
          amount: expense.amount,
          category: expense.category,
          description: expense.description || '',
          date: new Date(expense.created_at),
          icon: expense.icon,
        };
      });

      console.log('Formatted expenses:', formattedExpenses);
      setExpenses(formattedExpenses)
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Add new expense
  const addExpense = async (expenseData: {
    amount: number
    category: string
    description: string
    icon: string
  }) => {
    if (!user) return

    console.log('Adding expense to database:', expenseData); // Debug log

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          amount: expenseData.amount,
          category: expenseData.category,
          description: expenseData.description,
          icon: expenseData.icon,
        })
        .select()
        .single()

      if (error) throw error

      console.log('Expense saved to database:', data); // Debug log

      const newExpense: Expense = {
        id: data.id,
        amount: data.amount,
        category: data.category,
        description: data.description || '',
        date: new Date(data.created_at),
        icon: data.icon,
      }

      setExpenses(prev => [newExpense, ...prev])
      
      toast({
        title: "Expense Added",
        description: `₹${expenseData.amount.toFixed(2)} expense added successfully`,
      })
    } catch (error) {
      console.error('Error adding expense:', error)
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      })
    }
  }

  // Delete expense
  const deleteExpense = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      setExpenses(prev => prev.filter(expense => expense.id !== id))
      
      toast({
        title: "Expense Deleted",
        description: "Expense deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [user])

  return {
    expenses,
    loading,
    addExpense,
    deleteExpense,
    refetch: fetchExpenses,
  }
}