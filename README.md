# Budgee — Budget Tracker and AI-Powered Financial Advisor  

A smart application that helps you **track expenses, analyze spending patterns, and get budgeting insights** powered by FinGPT 

## 🎥 Demo  

Watch Budgee in action: [Demo Video](https://drive.google.com/)  

> 💡 Perfect for individuals and teams who want effortless financial tracking and AI-powered financial insights!  

---

## ⚙️ Features  

- **AI-Powered Financial Assistant** — FinGPT provides personalized insights into your spending  
- **Smart Expense Tracker** — Add, edit, and categorize expenses effortlessly  
- **Natural Language Queries** — Ask in plain English: “How much did I spend on food last week?” 
- **Real-time Analytics Dashboard** — Visualize income vs. expenses with charts  
- **Secure User Accounts** — Authentication and storage powered by Supabase

---

## 🛠️ Tech Stack  

- **Python 3.8+** — Backend core with FastAPI  
- **FinGPT** — Domain-specific financial LLM for analysis  
- **Supabase** — Database + Authentication  
- **Pinecone** — Vector search for advanced RAG queries  
- **Uvicorn** — ASGI server for high-performance backend
- **React + Vite** — Modern frontend with clean UI  
- **Tailwind CSS** — Responsive design system    

---

## 🚀 Quick Start  

### Prerequisites  
- Python 3.8+  
- Node.js 16+  
- Hugging Face API token  

### Installation  

# Clone the repository
```bash
git clone https://github.com/Luna-3012/Budgee-The-Budget-Tracker.git
```

# Backend setup
```bash
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

# Frontend setup
```bash
npm install
```

# Set your credentials in .env file (frontend & backend)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Hugging Face API Configuration
HF_API_TOKEN=your-huggingface-api-token
HF_MODEL=FinGPT/fingpt-mt_llama3-8b_lora
HF_API_URL=https://api-inference.huggingface.co/models/FinGPT/fingpt-mt_llama3-8b_lora
    
# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_CLOUD=your-pinecone-cloud
PINECONE_REGION=your-pinecone-region
INDEX_NAME=budget-bot
NAMESPACE=user_expenses

# Backend API Configuration
VITE_API_BASE_URL=http://localhost:8000
```

### Running the Application

```bash
# Terminal 1: Frontend
npm run frontend  

# Terminal 2: Backend
python start_backend.py
```

---

## 🔮 Future Scope

- **Multi-Currency Support** — Manage global finances effortlessly  
- **Investment Insights** — Track portfolios with AI-driven suggestions  
- **Voice Queries** — “Hey Budgee, how much can I save this month?”  

---

## 💬 Got Ideas? Questions?
I'd love to hear your feedback!
Whether it's a bug, feature suggestion, or just a "hey, this is cool!" — feel free to open an issue or connect with me directly. 

---


