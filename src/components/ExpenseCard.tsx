import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExpenseCardProps {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: Date;
  icon: string;
  onDelete: (id: string) => void;
}

export const ExpenseCard = ({ 
  id, 
  amount, 
  category, 
  description, 
  date, 
  icon, 
  onDelete 
}: ExpenseCardProps) => {
  console.log('ExpenseCard props:', { id, amount, category, description, date, icon }); 
  
  return (
    <Card className="p-4 hover:shadow-card transition-all duration-200 bg-gradient-card border-border/50">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xl flex-shrink-0">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{category}</h3>
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {date.toLocaleDateString()}
              </Badge>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground truncate">
                {description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-xl font-bold text-foreground">
              ₹{amount.toFixed(2)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};