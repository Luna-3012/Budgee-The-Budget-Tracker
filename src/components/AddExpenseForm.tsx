import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CategorySelector } from "./CategorySelector";
import { Receipt, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Tesseract from 'tesseract.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { findBestCategoryMatch } from "@/utils/categoryMapper";


interface AddExpenseFormProps {
  onAddExpense: (expense: {
    amount: number;
    category: string;
    description: string;
    icon: string;
  }) => Promise<void>;
}

export const AddExpenseForm = ({ onAddExpense }: AddExpenseFormProps) => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  const [description, setDescription] = useState("");
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !category) {
      toast({
        title: "Missing Information",
        description: "Please enter an amount and select a category",
        variant: "destructive",
      });
      return;
    }

    // Validate category is properly set
    if (!category || !categoryIcon) {
      toast({
        title: "Category Error",
        description: "Please select a valid category",
        variant: "destructive",
      });
      return;
    }

    // Additional validation for custom categories
    if (category.length < 2 || category.length > 20) {
      toast({
        title: "Invalid Category",
        description: "Category name must be between 2 and 20 characters",
        variant: "destructive",
      });
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    console.log('Submitting expense:', { amount: numAmount, category, description, icon: categoryIcon }); // Debug log
    
    await onAddExpense({
      amount: numAmount,
      category,
      description,
      icon: categoryIcon,
    });

    // Reset form
    setAmount("");
    setCategory("");
    setCategoryIcon("");
    setDescription("");
    
    console.log('Form reset completed'); 
  };

  const handleSelectCategory = (cat: string, icon: string) => {
    console.log('Category selected:', cat, 'Icon:', icon);
    setCategory(cat);
    setCategoryIcon(icon);
  };

  const handleCustomCategory = (customCategoryName: string) => {
    console.log('Custom category created:', customCategoryName); 
    
    // Validate custom category name
    if (customCategoryName.trim().length < 2) {
      toast({
        title: "Invalid Category Name",
        description: "Category name must be at least 2 characters long",
        variant: "destructive",
      });
      return;
    }
    
    if (customCategoryName.trim().length > 20) {
      toast({
        title: "Category Name Too Long",
        description: "Category name must be 20 characters or less",
        variant: "destructive",
      });
      return;
    }
    
    const match = findBestCategoryMatch(customCategoryName);
    
    if (match.isCustom) {
      setCategory(customCategoryName.trim());
      setCategoryIcon(match.icon);
      
      toast({
        title: "Custom Category Created",
        description: `Category "${customCategoryName.trim()}" has been created`,
      });
    } else {
      setCategory(match.category);
      setCategoryIcon(match.icon);
      
      toast({
        title: "Category Auto-Selected",
        description: `"${customCategoryName}" has been categorized as "${match.category}"`,
      });
    }
  };

  const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    setIsProcessingReceipt(true);
  
    try {
      toast({
        title: "Processing Receipt",
        description: "Extracting text from receipt...",
      });
  
      const result = await Tesseract.recognize(file, "eng");
      const extractedText = result.data.text;
  
      console.log("Extracted Text:", extractedText); // For debugging
  
      // Split text into lines for better parsing
      const lines = extractedText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      console.log("Lines:", lines); // Show individual lines
  
      // Clean and normalize text for better matching
      const normalizedText = extractedText
        .replace(/[^\w\s.,:-]/g, " ")
        .replace(/\s+/g, " ");
      const normalizedLines = normalizedText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
  
      let extractedAmount = null;
      let confidence = 0;
      let matchDetails = "";
  
      // Strategy 1: Look for explicit bill/total amount labels (HIGHEST CONFIDENCE)
      console.log("=== Strategy 1: Looking for explicit labels ===");
      const highConfidencePatterns = [
        /(?:^|\s)total\s*:\s*(\d+(?:\.\d{2})?)\s*$/im,
        /(?:^|\s)(\d+(?:\.\d{2})?)\s*total\s*$/im,
        /bill\s*amount\s*[:\s]*([\d,]+\.?\d*)/i,
        /total\s*amount\s*[:\s]*([\d,]+\.?\d*)/i,
        /grand\s*total\s*[:\s]*([\d,]+\.?\d*)/i,
        /net\s*amount\s*[:\s]*([\d,]+\.?\d*)/i,
        /final\s*amount\s*[:\s]*([\d,]+\.?\d*)/i,
        /amount\s*[:\s]*([\d,]+\.?\d*)\s*$/i,
        /([\d,]+\.?\d*)\s*bill\s*amount/i,
        /([\d,]+\.?\d*)\s*total\s*amount/i,
      ];
  
      // Check both original and normalized lines
      const allLines = [...lines, ...normalizedLines];
      for (const line of allLines) {
        console.log("Checking line:", line);
        for (let i = 0; i < highConfidencePatterns.length; i++) {
          const pattern = highConfidencePatterns[i];
          const match = line.match(pattern);
          if (match) {
            const amount = match[1].replace(/,/g, "");
            const numAmount = parseFloat(amount);
            console.log(
              `Pattern ${i} matched:`,
              match[0],
              "Amount:",
              amount
            );
            if (numAmount > 0 && numAmount < 1000000 && amount.length >= 3) {
              extractedAmount = amount;
              confidence = 95;
              matchDetails = `High confidence: "${match[0]}" in line "${line}"`;
              console.log("✓ High confidence match found:", matchDetails);
              break;
            }
          }
        }
        if (confidence >= 95) break;
      }
  
      // Strategy 2: Look for amounts in the right half or bottom of the receipt
      if (confidence < 95) {
        console.log("=== Strategy 2: Looking for positioned amounts ===");
        const bottomLines = lines.slice(-15);
  
        for (const line of bottomLines) {
          console.log("Checking bottom line:", line);
  
          if (line.match(/sub\s*total/i)) {
            console.log("Skipping Sub Total line");
            continue;
          }
  
          const totalMatch = line.match(/total\s*:\s*(\d+(?:\.\d{2})?)/i);
          if (totalMatch) {
            const amount = totalMatch[1];
            const numAmount = parseFloat(amount);
            console.log("Found Total line match:", line, "Amount:", amount);
  
            if (numAmount > 0 && numAmount < 100000) {
              extractedAmount = amount;
              confidence = 90;
              matchDetails = `High confidence: "Total" line found: "${line}"`;
              console.log("✓ Total line match found:", matchDetails);
              break;
            }
          }
  
          if (
            line.match(
              /\b(?:tel|phone|fax|email|@|www|\.com|pin|code|no\.|id|ip|reg|license)\b/i
            )
          ) {
            console.log("Skipping line with non-monetary indicators");
            continue;
          }
        }
      }
  
      // Strategy 2b: Bottom section analysis
      if (confidence < 90) {
        const amountPatterns = [/([\d,]+\.\d{2})/g, /([\d,]{3,})/g];
        const candidates = [];
        const bottomLines = lines.slice(-15);
  
        for (const line of bottomLines) {
          if (
            line.match(
              /\b(?:tel|phone|fax|email|@|www|\.com|pin|code|no\.|id|ip|reg|license|sub\s*total)\b/i
            )
          ) {
            continue;
          }
  
          for (const pattern of amountPatterns) {
            let match;
            while ((match = pattern.exec(line)) !== null) {
              const amountStr = match[1];
              const amount = parseFloat(amountStr.replace(/,/g, ""));
  
              console.log("Found potential amount:", amountStr, "=", amount);
  
              if (amount >= 100 && amount <= 100000) {
                let score = 30;
                if (amountStr.includes(".")) score += 25;
                if (line.trim().endsWith(amountStr)) score += 20;
                if (amount > 500) score += 15;
                if (amount > 1000) score += 10;
  
                const context = line.toLowerCase();
                if (context.includes("total") && !context.includes("sub")) {
                  score += 50;
                }
                if (context.includes("amount") || context.includes("bill")) {
                  score += 30;
                }
  
                candidates.push({
                  amount: amountStr.replace(/,/g, ""),
                  score,
                  line,
                  context: "bottom-section",
                });
  
                console.log("Candidate added:", {
                  amount: amountStr,
                  score,
                  line,
                });
              }
            }
          }
        }
  
        candidates.sort((a, b) => b.score - a.score);
  
        if (candidates.length > 0) {
          const best = candidates[0];
          if (best.score > confidence) {
            extractedAmount = best.amount;
            confidence = Math.min(85, best.score);
            matchDetails = `Positioned amount: "${best.amount}" (score: ${best.score}) in "${best.line}"`;
            console.log("✓ Positioned amount match found:", matchDetails);
          }
        }
      }
  
      // Strategy 3: Manual pattern search
      if (confidence < 80) {
        console.log("=== Strategy 3: Manual pattern search ===");
        const manualPatterns = [
          /(\d+,\d{3}\.\d{2})/g,
          /(\d{4,5}\.\d{2})/g,
          /(\d+\.\d{2})\s*$/gm,
          /^\s*(\d+,?\d*\.?\d*)\s*$/gm,
        ];
  
        for (let i = 0; i < manualPatterns.length; i++) {
          const pattern = manualPatterns[i];
          let match;
          while ((match = pattern.exec(extractedText)) !== null) {
            const amountStr = match[1];
            const amount = parseFloat(amountStr.replace(/,/g, ""));
  
            console.log(`Manual pattern ${i} found:`, amountStr, "=", amount);
  
            if (amount >= 100 && amount <= 100000) {
              let score = 20;
              if (amountStr.includes(".")) score += 30;
              if (amountStr.includes(",")) score += 20;
              if (amount > 1000) score += 15;
              if (amount > 10000) score += 10;
  
              if (score > confidence) {
                extractedAmount = amountStr.replace(/,/g, "");
                confidence = score;
                matchDetails = `Manual pattern: "${amountStr}" (score: ${score})`;
                console.log("✓ Manual pattern match:", matchDetails);
              }
            }
          }
        }
      }
  
      // Strategy 4: Largest reasonable amount
      if (!extractedAmount) {
        const allAmounts = [];
        const amountPattern = /([\d,]+(?:\.\d{2})?)/g;
        let match;
  
        while ((match = amountPattern.exec(extractedText)) !== null) {
          const amount = parseFloat(match[1].replace(/,/g, ""));
          if (amount >= 10 && amount <= 50000) {
            allAmounts.push(amount);
          }
        }
  
        if (allAmounts.length > 0) {
          allAmounts.sort((a, b) => b - a);
          extractedAmount = allAmounts[0].toString();
          confidence = 25;
          console.log("Last resort match:", extractedAmount);
        }
      }
  
      if (extractedAmount) {
        setAmount(extractedAmount);
  
        // Improved category detection
        if (!category) {
          const textLower = extractedText.toLowerCase();
  
          if (
            textLower.includes("hospital") ||
            textLower.includes("medical") ||
            textLower.includes("pharmacy") ||
            textLower.includes("clinic") ||
            textLower.includes("doctor") ||
            textLower.includes("patient") ||
            textLower.includes("inpatient") ||
            textLower.includes("consultation")
          ) {
            setCategory("Health");
            setCategoryIcon("⚕️");
          } else if (
            textLower.includes("delicacies") ||
            textLower.includes("restaurant") ||
            textLower.includes("food") ||
            textLower.includes("cafe") ||
            textLower.includes("dosa") ||
            textLower.includes("wada") ||
            textLower.includes("toast") ||
            textLower.includes("pure veg")
          ) {
            setCategory("Food");
            setCategoryIcon("🍕");
          } else if (
            textLower.includes("fuel") ||
            textLower.includes("petrol") ||
            textLower.includes("gas")
          ) {
            setCategory("Transport");
            setCategoryIcon("🚗");
          } else if (
            textLower.includes("grocery") ||
            textLower.includes("supermarket") ||
            textLower.includes("mart")
          ) {
            setCategory("Shopping");
            setCategoryIcon("🛍️");
          } else if (
            textLower.includes("movie") ||
            textLower.includes("cinema") ||
            textLower.includes("entertainment")
          ) {
            setCategory("Entertainment");
            setCategoryIcon("🎬");
          } else if (
            textLower.includes("school") ||
            textLower.includes("college") ||
            textLower.includes("university")
          ) {
            setCategory("Education");
            setCategoryIcon("📚");
          } else if (
            textLower.includes("electric") ||
            textLower.includes("water") ||
            textLower.includes("utility") ||
            textLower.includes("bill")
          ) {
            setCategory("Bills");
            setCategoryIcon("📄");
          } else {
            setCategory("Other");
            setCategoryIcon("💰");
          }
        }
  
        console.log("Final result:", {
          extractedAmount,
          confidence,
          matchDetails,
        });
  
        toast({
          title: "Receipt Processed",
          description: `Amount ₹${extractedAmount} extracted`,
        });
      } else {
        console.log("No amount found in any strategy");
        console.log("All lines:", lines);
        console.log("Full text for manual review:", extractedText);
        toast({
          title: "Processing Complete",
          description:
            "Could not extract amount. Please enter manually. Check console for OCR text.",
        });
      }
    } catch (error) {
      console.error("Receipt processing error:", error);
      toast({
        title: "Upload Error",
        description: "Failed to process receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingReceipt(false);
    }
  };
  

  return (
    <Card className="p-6 bg-gradient-card shadow-card">
      <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Plus className="h-5 w-5" />
        Add New Expense
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium text-foreground">
            Amount (₹)
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="text-lg font-semibold"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">Category</Label>
          <CategorySelector
            selectedCategory={category}
            onSelectCategory={handleSelectCategory}
            onCustomCategory={handleCustomCategory}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-foreground">
            Description (Optional)
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you spend on?"
            className="resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
            disabled={!amount || !category}
          >
            Add Expense
          </Button>
          
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              className="px-4 border-secondary hover:bg-secondary/10"
              disabled={isProcessingReceipt}
            >
              {isProcessingReceipt ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faReceipt} className="h-4 w-4" />
              )}
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleReceiptUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isProcessingReceipt}
            />
          </div>
        </div>
      </form>
    </Card>
  );
};