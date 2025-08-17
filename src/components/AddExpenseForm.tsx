import { useState, useRef } from "react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const { toast } = useToast();

  // Mark that user has interacted with the form
  const markUserInteraction = () => {
    if (!userHasInteracted) {
      setUserHasInteracted(true);
      console.log('User interaction detected');
    }
  };

  // COMPLETELY REMOVE form submission - only manual button click should work
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Form submit blocked - use button instead');
    // Do nothing - only manual button click should trigger submission
    return false;
  };

  // This is the ONLY way to submit the expense
  const handleManualAddExpense = async () => {
    console.log('Manual Add Expense clicked');
    
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('Already submitting, ignoring');
      return;
    }
    
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

    setIsSubmitting(true);
    console.log('Submitting expense:', { amount: numAmount, category, description, icon: categoryIcon }); 
    
    try {
      await onAddExpense({
        amount: numAmount,
        category,
        description,
        icon: categoryIcon,
      });

      // Reset form only after successful submission
      setAmount("");
      setCategory("");
      setCategoryIcon("");
      setDescription("");
      setUserHasInteracted(false);
      
      toast({
        title: "Expense Added",
        description: "Your expense has been successfully added",
      });
      
      console.log('Form reset completed');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectCategory = (cat: string, icon: string) => {
    console.log('Category selected:', cat, 'Icon:', icon);
    setCategory(cat);
    setCategoryIcon(icon);
    markUserInteraction();
    // DO NOT AUTO-SUBMIT - user must click Add Expense button
  };

  const handleCustomCategory = (customCategoryName: string) => {
    console.log('Custom category requested:', customCategoryName); 
    markUserInteraction();
    
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
    
    const trimmedName = customCategoryName.trim();
    
    // COMPLETELY BYPASS findBestCategoryMatch - Always create custom category as requested
    console.log(`Creating custom category: "${trimmedName}"`);
    
    // Set the custom category exactly as the user typed it
    setCategory(trimmedName);
    setCategoryIcon("💰"); // Default icon for custom categories
    
    // Show confirmation message
    toast({
      title: "Custom Category Created",
      description: `Category "${trimmedName}" has been created successfully!`,
      duration: 4000,
    });
    
    console.log(`✅ Custom category "${trimmedName}" created with 💰 icon`);
    
    // Optional: Show suggestion as a separate helpful hint (not forcing anything)
    try {
      const suggestion = findBestCategoryMatch(trimmedName);
      if (suggestion && !suggestion.isCustom) {
        // Show suggestion in a separate toast after a delay
        setTimeout(() => {
          toast({
            title: "💡 Helpful Suggestion",
            description: `Your "${trimmedName}" category could also fit under existing "${suggestion.category}" category. But feel free to keep your custom one!`,
            duration: 5000,
          });
        }, 2000);
      }
    } catch (error) {
      // Ignore suggestion errors - custom category creation should never fail
      console.log('Suggestion failed, but custom category created successfully');
    }
    
    // DO NOT AUTO-SUBMIT - user must click Add Expense button
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    markUserInteraction();
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    markUserInteraction();
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
  
      console.log("Extracted Text:", extractedText);
  
      // Split text into lines for better parsing
      const lines = extractedText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      console.log("Lines:", lines);
  
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
        // Enhanced patterns for various total formats including padded zeros
        /(?:^|\s)total\s*[:]\s*0*(\d+(?:\.\d{2})?)\s*$/im,
        /(?:^|\s)(\d+(?:\.\d{2})?)\s*total\s*$/im,
        /total\s*[:]\s*0*([1-9]\d*(?:\.\d{2})?)/im,
        /bill\s*amount\s*[:\s]*0*([1-9]\d*(?:\.\d{2})?)/i,
        /total\s*amount\s*[:\s]*0*([1-9]\d*(?:\.\d{2})?)/i,
        /grand\s*total\s*[:\s]*0*([1-9]\d*(?:\.\d{2})?)/i,
        /net\s*amount\s*[:\s]*0*([1-9]\d*(?:\.\d{2})?)/i,
        /final\s*amount\s*[:\s]*0*([1-9]\d*(?:\.\d{2})?)/i,
        /amount\s*[:\s]*0*([1-9]\d*(?:\.\d{2})?)\s*$/i,
        /([1-9]\d*(?:\.\d{2})?)\s*bill\s*amount/i,
        /([1-9]\d*(?:\.\d{2})?)\s*total\s*amount/i,
        // Additional patterns for fuel receipts and Indian formats
        /total\s*[:\s]*0*([1-9]\d{3,}(?:\.\d{2})?)/i,
        /amount\s*[:\s]*0*([1-9]\d{3,}(?:\.\d{2})?)/i,
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
            // Adjusted validation - allow larger amounts and better filtering
            if (numAmount > 0 && numAmount < 1000000 && numAmount >= 10) {
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
  
          // Skip sub-total lines
          if (line.match(/sub\s*total/i)) {
            console.log("Skipping Sub Total line");
            continue;
          }
  
          // Enhanced total line matching with padded zeros
          const totalMatch = line.match(/total\s*[:]\s*0*([1-9]\d*(?:\.\d{2})?)/i);
          if (totalMatch) {
            const amount = totalMatch[1];
            const numAmount = parseFloat(amount);
            console.log("Found Total line match:", line, "Amount:", amount);
  
            if (numAmount >= 10 && numAmount < 1000000) {
              extractedAmount = amount;
              confidence = 90;
              matchDetails = `High confidence: "Total" line found: "${line}"`;
              console.log("✓ Total line match found:", matchDetails);
              break;
            }
          }
  
          // Skip lines with non-monetary indicators
          if (
            line.match(
              /\b(?:tel|phone|fax|email|@|www|\.com|pin|code|no\.|id|ip|reg|license|receipt|local|fip|nozzle|product|density|rate|volume|vehicle|mobile|date|time|cst|lst|vat|thank)\b/i
            )
          ) {
            console.log("Skipping line with non-monetary indicators");
            continue;
          }
        }
      }
  
      // Strategy 2b: Enhanced bottom section analysis with better patterns
      if (confidence < 90) {
        const amountPatterns = [
          // Pattern for padded amounts like 02000.00
          /0*([1-9]\d{3,}\.?\d{0,2})/g,
          // Standard patterns
          /([\d,]+\.\d{2})/g, 
          /([\d,]{3,})/g
        ];
        const candidates = [];
        const bottomLines = lines.slice(-15);
  
        for (const line of bottomLines) {
          // Enhanced skip conditions
          if (
            line.match(
              /\b(?:tel|phone|fax|email|@|www|\.com|pin|code|no\.|id|ip|reg|license|sub\s*total|receipt|local|fip|nozzle|product|density|rate(?!\s*:)|volume(?!\s*:)|vehicle|mobile|date|time|cst|lst|vat|thank)\b/i
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
  
              // Better amount validation
              if (amount >= 50 && amount <= 500000) {
                let score = 30;
                
                // Scoring improvements
                if (amountStr.includes(".")) score += 25;
                if (line.trim().endsWith(amountStr) || line.trim().endsWith(amountStr + "0")) score += 20;
                if (amount >= 100) score += 10;
                if (amount >= 500) score += 15;
                if (amount >= 1000) score += 20;
                if (amount >= 5000) score += 10;
  
                const context = line.toLowerCase();
                if (context.includes("total") && !context.includes("sub")) {
                  score += 50;
                }
                if (context.includes("amount") || context.includes("bill")) {
                  score += 30;
                }
                
                // Boost score for fuel receipts with total pattern
                if (context.match(/total\s*[:]/)) {
                  score += 40;
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
  
      // Strategy 3: Enhanced manual pattern search
      if (confidence < 80) {
        console.log("=== Strategy 3: Manual pattern search ===");
        const manualPatterns = [
          // Padded zero patterns
          /0+([1-9]\d{3,}\.\d{2})/g,
          /0+([1-9]\d{3,})/g,
          // Standard patterns
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
  
            if (amount >= 50 && amount <= 500000) {
              let score = 20;
              if (amountStr.includes(".")) score += 30;
              if (amountStr.includes(",")) score += 20;
              if (amount >= 1000) score += 25;
              if (amount >= 5000) score += 15;
              if (amount >= 10000) score += 10;
  
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
  
      // Strategy 4: Largest reasonable amount (improved)
      if (!extractedAmount) {
        console.log("=== Strategy 4: Largest reasonable amount ===");
        const allAmounts = [];
        const amountPattern = /([\d,]+(?:\.\d{2})?)/g;
        let match;
  
        while ((match = amountPattern.exec(extractedText)) !== null) {
          const amount = parseFloat(match[1].replace(/,/g, ""));
          if (amount >= 50 && amount <= 100000) {
            allAmounts.push(amount);
          }
        }
  
        if (allAmounts.length > 0) {
          allAmounts.sort((a, b) => b - a);
          extractedAmount = allAmounts[0].toString();
          confidence = 25;
          matchDetails = `Last resort: largest amount "${extractedAmount}"`;
          console.log("Last resort match:", extractedAmount);
        }
      }
  
      // Only populate form fields if amount extracted - NO AUTOMATIC EXPENSE CREATION
      if (extractedAmount) {
        setAmount(extractedAmount);
        // DO NOT mark as user interaction - receipt processing is automatic
  
        // CHANGED: Only suggest category as a helpful hint, don't auto-set anything
        if (!category) {
          const textLower = extractedText.toLowerCase();
          let suggestedCategory = null;
          let suggestedIcon = null;
  
          if (
            // Fuel companies and stations
            textLower.includes("indianoil") ||
            textLower.includes("indian oil") ||
            textLower.includes("fuel") ||
            textLower.includes("petrol") ||
            textLower.includes("diesel") ||
            textLower.includes("gas") ||
            textLower.includes("bharat petroleum") ||
            textLower.includes("hindustan petroleum") ||
            textLower.includes("hp petro") ||
            textLower.includes("iocl") ||
            textLower.includes("bpcl") ||
            textLower.includes("hpcl") ||
            textLower.includes("reliance petroleum") ||
            textLower.includes("essar oil") ||
            textLower.includes("shell") ||
            textLower.includes("total oil") ||
            textLower.includes("nayara energy") ||
            
            // Automotive and vehicle related
            textLower.includes("tire") ||
            textLower.includes("tyre") ||
            textLower.includes("wheel") ||
            textLower.includes("automotive") ||
            textLower.includes("garage") ||
            textLower.includes("service station") ||
            textLower.includes("mechanic") ||
            textLower.includes("car wash") ||
            textLower.includes("vehicle") ||
            textLower.includes("auto") ||
            textLower.includes("motor") ||
            textLower.includes("engine oil") ||
            textLower.includes("lubricant") ||
            textLower.includes("brake") ||
            textLower.includes("battery") ||
            textLower.includes("servicing") ||
            textLower.includes("maintenance") ||
            
            // Transport services
            textLower.includes("taxi") ||
            textLower.includes("uber") ||
            textLower.includes("ola") ||
            textLower.includes("cab") ||
            textLower.includes("bus") ||
            textLower.includes("metro") ||
            textLower.includes("railway") ||
            textLower.includes("train") ||
            textLower.includes("airport") ||
            textLower.includes("parking") ||
            textLower.includes("toll") ||
            textLower.includes("transport") ||
            
            // Fuel related terms that might appear
            textLower.includes("pump") ||
            textLower.includes("nozzle") ||
            textLower.includes("litre") ||
            textLower.includes("liter") ||
            textLower.includes("octane") ||
            textLower.includes("premium") ||
            textLower.includes("unleaded") ||
            textLower.includes("cng") ||
            textLower.includes("lpg") ||
            
            // Common fuel station indicators
            (textLower.includes("rate") && textLower.includes("volume")) ||
            (textLower.includes("density") && textLower.includes("product")) ||
            textLower.includes("preset type") ||
            textLower.includes("xtra prem") || // Extra Premium fuel
            (textLower.includes("speed") && textLower.includes("97")) // High octane fuel
          ) {
            suggestedCategory = "Transport";
            suggestedIcon = "⛽";
          } else if (
            textLower.includes("hospital") ||
            textLower.includes("medical") ||
            textLower.includes("pharmacy") ||
            textLower.includes("clinic") ||
            textLower.includes("doctor") ||
            textLower.includes("patient") ||
            textLower.includes("inpatient") ||
            textLower.includes("consultation")
          ) {
            suggestedCategory = "Health";
            suggestedIcon = "⚕️";
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
            suggestedCategory = "Food";
            suggestedIcon = "🍕";
          } else if (
            textLower.includes("grocery") ||
            textLower.includes("supermarket") ||
            textLower.includes("mart")
          ) {
            suggestedCategory = "Shopping";
            suggestedIcon = "🛍️";
          } else if (
            textLower.includes("movie") ||
            textLower.includes("cinema") ||
            textLower.includes("entertainment")
          ) {
            suggestedCategory = "Entertainment";
            suggestedIcon = "🎬";
          } else if (
            textLower.includes("school") ||
            textLower.includes("college") ||
            textLower.includes("university")
          ) {
            suggestedCategory = "Education";
            suggestedIcon = "📚";
          } else if (
            textLower.includes("electric") ||
            textLower.includes("water") ||
            textLower.includes("utility") ||
            textLower.includes("bill")
          ) {
            suggestedCategory = "Bills";
            suggestedIcon = "📄";
          } else {
            suggestedCategory = "Other";
            suggestedIcon = "💰";
          }

          // FIXED: Pre-select the suggested category but don't auto-submit
          // User can still change it before clicking "Add Expense"
          if (suggestedCategory && suggestedIcon) {
            setCategory(suggestedCategory);
            setCategoryIcon(suggestedIcon);
            console.log(`Pre-selected suggested category: ${suggestedCategory} with icon: ${suggestedIcon}`);
          }
          
          console.log("Final result:", {
            extractedAmount,
            confidence,
            matchDetails,
            suggestedCategory,
            preSelected: !!suggestedCategory
          });
  
          toast({
            title: "Receipt Processed",
            description: `Amount ₹${extractedAmount} extracted (${Math.round(confidence)}% confidence). ${suggestedCategory ? `Category pre-selected as "${suggestedCategory}". ` : ''}Review details and click "Add Expense" to save.`,
            duration: 6000,
          });
        } else {
          // User already has a category selected
          toast({
            title: "Receipt Processed",
            description: `Amount ₹${extractedAmount} extracted (${Math.round(confidence)}% confidence). Review details and click "Add Expense" to save.`,
            duration: 5000,
          });
        }
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
      
      {/* Form that CANNOT submit automatically */}
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium text-foreground">
            Amount (₹)
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            className="text-lg font-semibold"
          />
        </div>

        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
          <Label className="text-sm font-medium text-foreground">Category</Label>
          <div onClick={(e) => e.stopPropagation()}>
            <CategorySelector
              selectedCategory={category}
              onSelectCategory={handleSelectCategory}
              onCustomCategory={handleCustomCategory}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-foreground">
            Description (Optional)
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="What did you spend on?"
            className="resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          {/* ONLY button that can add expense - NOT a submit button */}
          <Button
            type="button"
            onClick={handleManualAddExpense}
            className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
            disabled={!amount || !category || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              "Add Expense"
            )}
          </Button>
          
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              className="px-4 border-secondary hover:bg-secondary/10"
              disabled={isProcessingReceipt}
              title="Upload Receipt"
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
