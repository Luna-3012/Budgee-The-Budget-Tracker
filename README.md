# BudgetBot - AI-Powered Financial Advisor

A full-stack application that uses FinGPT to provide intelligent financial analysis and advice based on your expense data.

## 🚀 Quick Start

### 1. Automated Setup (Recommended)

```bash
# Run the setup script
python setup.py
```

This will:
- Install all dependencies
- Create `.env` file from template
- Install spaCy English model
- Verify configuration

### 2. Manual Setup

#### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

#### Frontend Setup

```bash
# Install dependencies
npm install

# Create environment file
cp env.example .env

# Update .env with your credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
HF_API_TOKEN=your_hf_api_key
```

#### Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install spaCy English model
python -m spacy download en_core_web_sm

# Create .env file (if not done in frontend setup)
cp env.example .env
```

### 3. Database Setup

1. Create a new project in Supabase
2. Create the `expenses` table:

```sql
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own expenses" ON expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (auth.uid() = user_id);
```

## 🏃‍♂️ Running the Application

### Start Backend

```bash
python start_backend.py
```

The backend will be available at `http://localhost:8000`

### Start Frontend

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Test the Application

```bash
# Test the backend health
curl http://localhost:8000/api/health

# Or use a simple HTTP request to test the FinGPT endpoint
```

## 🔧 Configuration

### Required Environment Variables

```bash
# Supabase (Required)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Hugging Face (Required for FinGPT)
HF_API_TOKEN=your_huggingface_token
HF_API_URL=https://api-inference.huggingface.co/models/FinGPT/fingpt-mt_llama3-8b_lora
HF_MODEL=FinGPT/fingpt-mt_llama3-8b_lora
```

### Optional Environment Variables

```bash
# Pinecone (Optional - for vector search)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=budget-bot

# OpenAI (Optional - for embeddings)
OPENAI_API_KEY=your_openai_api_key
```

## 🏗️ Architecture

### Backend Components

- **`main.py`**: FastAPI application with endpoints
- **`fingpt_queries.py`**: FinGPT integration and query processing
- **`vector_manager.py`**: Pinecone vector operations
- **`pinecone_manager.py`**: Pinecone client management
- **`query_filter.py`**: Query parsing and filtering
- **`rag_query.py`**: RAG (Retrieval-Augmented Generation) operations

### Frontend Components

- **`FinGPTAdvisor.tsx`**: AI chat interface
- **`Dashboard.tsx`**: Expense overview and analytics
- **`AddExpenseForm.tsx`**: Expense entry form
- **`AuthForm.tsx`**: User authentication

## 🔍 Troubleshooting

### Common Issues

#### 1. Pinecone Index Creation Error
```
Failed to create index: spec must be of type dict, ServerlessSpec, PodSpec, or ByocSpec
```

**Solution**: The application now handles this gracefully. Pinecone is optional and the app will work without it using fallback mode.

#### 2. FinGPT API Errors
```
HF_API_TOKEN not properly configured
```

**Solution**: 
1. Get a Hugging Face API token from https://huggingface.co/settings/tokens
2. Add it to your `.env` file as `HF_API_TOKEN=your_token_here`

#### 3. spaCy Model Not Found
```
Can't find model 'en_core_web_sm'
```

**Solution**:
```bash
python -m spacy download en_core_web_sm
```

#### 4. Backend Won't Start
```
ModuleNotFoundError: No module named 'backend'
```

**Solution**: Make sure you're running from the project root directory:
```bash
cd /path/to/BudgetBot
python start_backend.py
```

### Testing

Run the test script to verify everything works:
```bash
python test_backend_simple.py
```

## 📊 Features

- **AI-Powered Analysis**: Get intelligent insights about your spending patterns
- **Natural Language Queries**: Ask questions in plain English
- **Expense Tracking**: Add, edit, and categorize expenses
- **Real-time Analytics**: Visualize your spending data
- **Vector Search**: Advanced semantic search (when Pinecone is configured)
- **User Authentication**: Secure user accounts with Supabase

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Run the test script: `python test_backend_simple.py`
3. Check the logs in the terminal
4. Open an issue with detailed error information
