import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { findBestCategoryMatch, getCategorySuggestions } from "@/utils/categoryMapper";

const categories = [
  { name: "Food", icon: "🍕", color: "bg-red-100 text-red-600" },
  { name: "Transport", icon: "🚗", color: "bg-blue-100 text-blue-600" },
  { name: "Shopping", icon: "🛍️", color: "bg-purple-100 text-purple-600" },
  { name: "Entertainment", icon: "🎬", color: "bg-pink-100 text-pink-600" },
  { name: "Bills", icon: "📄", color: "bg-orange-100 text-orange-600" },
  { name: "Health", icon: "⚕️", color: "bg-green-100 text-green-600" },
  { name: "Education", icon: "📚", color: "bg-indigo-100 text-indigo-600" },
  { name: "Other", icon: "💰", color: "bg-gray-100 text-gray-600" },
];

interface CategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (category: string, icon: string) => void;
  onCustomCategory?: (categoryName: string) => void;
}

export const CategorySelector = ({ selectedCategory, onSelectCategory, onCustomCategory }: CategorySelectorProps) => {
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ category: string; icon: string; confidence: number }>>([]);

  // Update suggestions when user types
  useEffect(() => {
    if (customCategoryName.trim()) {
      const newSuggestions = getCategorySuggestions(customCategoryName);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [customCategoryName]);

  const handleCategoryClick = (categoryName: string, categoryIcon: string) => {
    if (categoryName === "Other" && onCustomCategory) {
      setIsCustomDialogOpen(true);
    } else {
      onSelectCategory(categoryName, categoryIcon);
    }
  };

  const handleCustomCategorySubmit = () => {
    if (customCategoryName.trim()) {
      const match = findBestCategoryMatch(customCategoryName);
      
      if (match.isCustom) {
        // Create custom category
        onCustomCategory(customCategoryName.trim());
        onSelectCategory(customCategoryName.trim(), match.icon);
      } else {
        // Use suggested category
        onSelectCategory(match.category, match.icon);
      }
      
      setCustomCategoryName("");
      setIsCustomDialogOpen(false);
    }
  };

  const handleCustomCategoryCancel = () => {
    setCustomCategoryName("");
    setIsCustomDialogOpen(false);
  };

  const handleSuggestionClick = (suggestion: { category: string; icon: string; confidence: number }) => {
    onSelectCategory(suggestion.category, suggestion.icon);
    setCustomCategoryName("");
    setIsCustomDialogOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        {categories.map((category) => (
          <Button
            key={category.name}
            variant="outline"
            className={cn(
              "h-16 flex-col gap-1 border-2 transition-all duration-200",
              selectedCategory === category.name
                ? "border-primary bg-primary/10 scale-105 shadow-md"
                : "border-border hover:border-primary/50 hover:bg-gradient-card"
            )}
            onClick={() => handleCategoryClick(category.name, category.icon)}
          >
            <span className="text-2xl">{category.icon}</span>
            <span className="text-xs font-medium">{category.name}</span>
          </Button>
        ))}
      </div>
      {selectedCategory && (
        <div className="text-sm text-muted-foreground text-center">
          Selected: <span className="font-medium text-primary">{selectedCategory}</span>
        </div>
      )}

      {/* Custom Category Dialog */}
      <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Smart Category Selection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-category">What did you spend on?</Label>
              <Input
                id="custom-category"
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                placeholder="e.g., coffee, movies, stocks, gym membership..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomCategorySubmit();
                  }
                }}
                autoFocus
              />
            </div>
            
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Suggested Categories:</Label>
                <div className="space-y-2">
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="text-lg">{suggestion.icon}</span>
                      <span className="flex-1 text-left">{suggestion.category}</span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(suggestion.confidence * 100)}% match
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCustomCategoryCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleCustomCategorySubmit}
                disabled={!customCategoryName.trim()}
              >
                {suggestions.length > 0 ? 'Use Custom' : 'Create Category'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};