import * as tf from 'tensorflow';

export interface CategoryMapping {
  keywords: string[];
  category: string;
  icon: string;
}

export interface CategoryPrediction {
  category: string;
  icon: string;
  confidence: number;
  isCustom: boolean;
}

// Category icons mapping
const categoryIcons: Record<string, string> = {
  'Food': '🍕',
  'Transport': '🚗',
  'Shopping': '🛍️',
  'Entertainment': '🎬',
  'Bills': '📄',
  'Health': '⚕️',
  'Education': '📚',
  'Other': '💰'
};

interface CategoryClassifier {
  predict(input: string): Promise<{
    category: string;
    confidence: number;
    probabilities: Array<{ category: string; probability: number }>;
  }>;
  isLoaded(): boolean;
  load(): Promise<void>;
}

class CategoryClassifierService implements CategoryClassifier {
  private model: any = null;
  private isModelLoaded = false;

  async load(): Promise<void> {
    if (this.isModelLoaded) return;
    
    try {
      this.model = await tf.loadLayersModel('/models/category_classifier.json');
      await new Promise(resolve => setTimeout(resolve, 100));
      this.isModelLoaded = true;
      console.log('Category classifier model loaded successfully');
    } catch (error) {
      console.error('Failed to load category classifier model:', error);
      throw error;
    }
  }

  isLoaded(): boolean {
    return this.isModelLoaded;
  }

  async predict(input: string): Promise<{
    category: string;
    confidence: number;
    probabilities: Array<{ category: string; probability: number }>;
  }> {
    if (!this.isModelLoaded) {
      await this.load();
    }

    const processedInput = this.preprocessInput(input);

    try {
      // Convert text to numerical format (you need to implement this based on your model)
      const encodedInput = this.encodeInput(processedInput);
      const inputTensor = tf.tensor2d([encodedInput]);
      
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const probabilities = await prediction.data();

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      // Map probabilities to categories
      const categories = Object.keys(categoryIcons);
      const results = categories.map((category, index) => ({
        category,
        probability: probabilities[index] || 0
      }));
    
      const bestMatch = results.reduce((best, current) => 
        current.probability > best.probability ? current : best
      );
    
      return {
        category: bestMatch.category,
        confidence: bestMatch.probability,
        probabilities: results.sort((a, b) => b.probability - a.probability)
      };
    } catch (error) {
      console.error('Prediction failed:', error);
      return {
        category: 'Other',
        confidence: 0.1,
        probabilities: [{ category: 'Other', probability: 0.1 }]
      };
    }
  }

  private preprocessInput(input: string): string {
    return input.toLowerCase().trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');
  }
}

// Global classifier instance
const category_classifier = new CategoryClassifierService();

export async function initializeCategoryClassifier(): Promise<void> {
  try {
    await category_classifier.load();
  } catch (error) {
    console.error('Failed to initialize category classifier:', error);
  }
}

export async function findBestCategoryMatch(input: string): Promise<{
  category: string;
  icon: string;
  isCustom: boolean;
  confidence?: number;
}> {
  try {
    const prediction = await category_classifier.predict(input);
    
    const icon = categoryIcons[prediction.category] || categoryIcons['Other'];
    const isCustom = !Object.keys(categoryIcons).includes(prediction.category);
    
    return {
      category: prediction.category,
      icon,
      isCustom,
      confidence: prediction.confidence
    };
  } catch (error) {
    console.error('Category prediction failed:', error);
    
    // Fallback to custom category
    return {
      category: input,
      icon: categoryIcons['Other'],
      isCustom: true,
      confidence: 0.1
    };
  }
}

// Function to get category suggestions with confidence scores
export async function getCategorySuggestions(input: string): Promise<Array<{
  category: string;
  icon: string;
  confidence: number;
}>> {
  try {
    const prediction = await category_classifier.predict(input);
    
    return prediction.probabilities
      .filter(p => p.probability > 0.1) // Filter low confidence predictions
      .slice(0, 5) // Top 5 suggestions
      .map(p => ({
        category: p.category,
        icon: categoryIcons[p.category] || categoryIcons['Other'],
        confidence: p.probability
      }));
  } catch (error) {
    console.error('Failed to get category suggestions:', error);
    return [];
  }
}

// Utility function to check if classifier is ready
export function isClassifierReady(): boolean {
  return category_classifier.isLoaded();
}

// Function to get all available categories with their icons
export function getAvailableCategories(): Array<{ category: string; icon: string }> {
  return Object.entries(categoryIcons).map(([category, icon]) => ({
    category,
    icon
  }));
}
