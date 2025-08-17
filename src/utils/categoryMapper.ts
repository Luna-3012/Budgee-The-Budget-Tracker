// Smart category mapping utility
export interface CategoryMapping {
  keywords: string[];
  category: string;
  icon: string;
}

// Predefined category mappings for common items
export const categoryMappings: CategoryMapping[] = [
  // Food & Dining
  {
    keywords: ['coffee', 'cafe', 'restaurant', 'food', 'meal', 'lunch', 'dinner', 'breakfast', 'snack', 'pizza', 'burger', 'sandwich', 'ice cream', 'dessert', 'bakery', 'pastry', 'tea', 'juice', 'soda', 'drink', 'beverage', 'alcohol', 'beer', 'wine', 'cocktail', 'bar', 'pub', 'takeout', 'delivery', 'fast food', 'dining', 'cuisine', 'chef', 'kitchen', 'catering'],
    category: 'Food',
    icon: '🍕'
  },
  
  // Transportation
  {
    keywords: ['fuel', 'petrol', 'gas', 'diesel', 'uber', 'lyft', 'taxi', 'cab', 'bus', 'train', 'metro', 'subway', 'parking', 'toll', 'maintenance', 'repair', 'car', 'vehicle', 'transport', 'commute', 'travel', 'flight', 'airline', 'airport', 'rental', 'bike', 'scooter', 'motorcycle', 'auto', 'automotive', 'garage', 'service'],
    category: 'Transport',
    icon: '🚗'
  },
  
  // Shopping
  {
    keywords: ['shopping', 'mall', 'store', 'retail', 'clothing', 'fashion', 'shoes', 'accessories', 'jewelry', 'cosmetics', 'makeup', 'perfume', 'electronics', 'gadget', 'phone', 'laptop', 'computer', 'appliance', 'furniture', 'home', 'decor', 'gift', 'present', 'book', 'magazine', 'toy', 'game', 'sport', 'equipment', 'gear', 'outfit', 'dress', 'shirt', 'pants', 'jeans', 'bag', 'purse', 'wallet'],
    category: 'Shopping',
    icon: '🛍️'
  },
  
  // Entertainment
  {
    keywords: ['movie', 'cinema', 'theater', 'concert', 'show', 'performance', 'entertainment', 'game', 'gaming', 'arcade', 'amusement', 'park', 'zoo', 'museum', 'exhibition', 'festival', 'party', 'event', 'ticket', 'booking', 'reservation', 'streaming', 'netflix', 'spotify', 'music', 'album', 'song', 'podcast', 'subscription', 'membership', 'club', 'karaoke', 'bowling', 'pool', 'billiards', 'casino', 'gambling', 'lottery'],
    category: 'Entertainment',
    icon: '🎬'
  },
  
  // Bills & Utilities
  {
    keywords: ['bill', 'electricity', 'water', 'gas', 'internet', 'wifi', 'phone', 'mobile', 'landline', 'cable', 'tv', 'television', 'streaming', 'subscription', 'utility', 'rent', 'mortgage', 'insurance', 'premium', 'service', 'maintenance', 'repair', 'cleaning', 'laundry', 'dry cleaning', 'garbage', 'trash', 'sewage', 'heating', 'cooling', 'ac', 'air conditioning'],
    category: 'Bills',
    icon: '📄'
  },
  
  // Health & Medical
  {
    keywords: ['hospital', 'medical', 'doctor', 'physician', 'dentist', 'pharmacy', 'medicine', 'drug', 'pill', 'prescription', 'health', 'fitness', 'gym', 'workout', 'exercise', 'yoga', 'pilates', 'massage', 'therapy', 'treatment', 'surgery', 'consultation', 'checkup', 'vaccine', 'vitamin', 'supplement', 'protein', 'nutrition', 'diet', 'wellness', 'spa', 'salon', 'beauty', 'cosmetic', 'dental', 'optical', 'glasses', 'contact', 'lens'],
    category: 'Health',
    icon: '⚕️'
  },
  
  // Education
  {
    keywords: ['school', 'college', 'university', 'education', 'course', 'class', 'training', 'workshop', 'seminar', 'lecture', 'tutorial', 'lesson', 'study', 'book', 'textbook', 'material', 'supply', 'stationery', 'pen', 'pencil', 'paper', 'notebook', 'laptop', 'computer', 'software', 'app', 'application', 'tuition', 'fee', 'scholarship', 'loan', 'student', 'academic', 'research', 'library', 'museum', 'exhibition'],
    category: 'Education',
    icon: '📚'
  }
];

// Function to find the best matching category for a given input
export function findBestCategoryMatch(input: string): { category: string; icon: string; isCustom: boolean } {
  const normalizedInput = input.toLowerCase().trim();
  
  // Check for exact matches first
  for (const mapping of categoryMappings) {
    if (mapping.keywords.some(keyword => normalizedInput === keyword)) {
      return {
        category: mapping.category,
        icon: mapping.icon,
        isCustom: false
      };
    }
  }
  
  // Check for partial matches
  for (const mapping of categoryMappings) {
    if (mapping.keywords.some(keyword => normalizedInput.includes(keyword) || keyword.includes(normalizedInput))) {
      return {
        category: mapping.category,
        icon: mapping.icon,
        isCustom: false
      };
    }
  }
  
  // Check for word matches (split by spaces)
  const inputWords = normalizedInput.split(/\s+/);
  for (const mapping of categoryMappings) {
    for (const word of inputWords) {
      if (mapping.keywords.some(keyword => keyword.includes(word) || word.includes(keyword))) {
        return {
          category: mapping.category,
          icon: mapping.icon,
          isCustom: false
        };
      }
    }
  }
  
  // If no match found, return as custom category
  return {
    category: input,
    icon: '💰',
    isCustom: true
  };
}

// Function to get suggestions based on partial input
export function getCategorySuggestions(input: string): Array<{ category: string; icon: string; confidence: number }> {
  const normalizedInput = input.toLowerCase().trim();
  const suggestions: Array<{ category: string; icon: string; confidence: number }> = [];
  
  for (const mapping of categoryMappings) {
    let confidence = 0;
    
    // Exact match gets highest confidence
    if (mapping.keywords.some(keyword => normalizedInput === keyword)) {
      confidence = 1.0;
    }
    // Partial match gets medium confidence
    else if (mapping.keywords.some(keyword => normalizedInput.includes(keyword) || keyword.includes(normalizedInput))) {
      confidence = 0.8;
    }
    // Word match gets lower confidence
    else {
      const inputWords = normalizedInput.split(/\s+/);
      for (const word of inputWords) {
        if (mapping.keywords.some(keyword => keyword.includes(word) || word.includes(keyword))) {
          confidence = 0.6;
          break;
        }
      }
    }
    
    if (confidence > 0) {
      suggestions.push({
        category: mapping.category,
        icon: mapping.icon,
        confidence
      });
    }
  }
  
  // Sort by confidence (highest first)
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
