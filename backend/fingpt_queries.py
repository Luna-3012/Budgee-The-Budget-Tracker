"""
Security:
If user-facing, ensure authentication on FastAPI endpoints to prevent unauthorized use.
"""

from typing import List, Dict
import os
import json
import pinecone
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from .vector_manager import upsert_expenses_to_pinecone
from .query_filter import extract_filters_from_query
from .rag_query import query_user_expenses, format_context_from_results
from .pinecone_manager import pinecone_manager

# Hugging Face config
HF_API_TOKEN = os.getenv("HF_API_TOKEN")
HF_MODEL = os.getenv("HF_MODEL")
HF_API_URL = os.getenv("HF_API_URL")

if not HF_MODEL:
    HF_MODEL = os.getenv("HF_MODEL", "gpt2")
if not HF_API_URL:
    HF_API_URL = os.getenv("HF_API_URL", "https://api-inference.huggingface.co/models/gpt2")

# Get Pinecone index from manager
index = pinecone_manager.get_index()

def build_prompt(question: str, context: str) -> str:
    """
    Prepare the prompt text sent to FinGPT.
    """
    return f"""
**Role:** You are a financial analysis AI specialized in expense tracking and budgeting.

**Objective:** Analyze user spending data and provide accurate, simple-to-understand answers strictly using the given context.

**Context:** 
{context}

**Instructions:**
**Instruction 1:** Answer only based on context.
**Instruction 2:** Explain in simple language for non-experts.
**Instruction 3:** Use bullet points if suitable.
**Instruction 4:** If context is insufficient, state "Not enough information to answer."
**Instruction 5:** Provide your output in 3 short sections:  
   - Direct Answer  
   - Supporting Details  
   - Actionable Recommendations  

**Notes:**
- Do not hallucinate information.
- Be concise and actionable.
- Explain financial terms briefly if used. 
- Use bullet points for clarity.  

Question:
{question}
"""


def call_fingpt_api(prompt: str) -> str:
    """
    Send the prompt to Hugging Face FinGPT API and return the answer text.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        # Validate API token
        if not HF_API_TOKEN or HF_API_TOKEN == "your_huggingface_token_here":
            logger.error("HF_API_TOKEN not properly configured")
            return "I apologize, but the AI service is not properly configured. Please contact support."
        
        logger.info(f"Calling FinGPT API with prompt length: {len(prompt)}")
        logger.info(f"API URL: {HF_API_URL}")
        
        headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
        
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": 256,
                "temperature": 0.7,
                "top_p": 0.9
            }
        }

        logger.info("Sending request to FinGPT API...")
        r = requests.post(HF_API_URL, headers=headers, json=payload, timeout=30)

        logger.info(f"FinGPT API response status: {r.status_code}")
        
        if r.status_code != 200:
            logger.error(f"FinGPT API error - Status: {r.status_code}, Response: {r.text}")
            
            # Handle specific error cases
            if r.status_code == 401:
                return "I apologize, but there's an authentication issue with the AI service. Please check the API configuration."
            elif r.status_code == 403:
                error_text = r.text.lower()
                if "permissions" in error_text or "inference" in error_text:
                    return "I apologize, but the AI service requires additional permissions. Please ensure your Hugging Face token has inference permissions enabled."
                else:
                    return "I apologize, but access to the AI service is forbidden. Please check your API configuration."
            elif r.status_code == 404:
                return "I apologize, but the AI model is not available. The system will use local analysis instead."
            elif r.status_code == 503:
                return "I apologize, but the AI service is currently unavailable. Please try again in a few minutes."
            else:
                return f"I apologize, but there was an error with the AI service (Status: {r.status_code}). Please try again."

        try:
            output = r.json()
            logger.info(f"FinGPT API response type: {type(output)}")
            logger.info(f"FinGPT API response: {output}")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            return "I apologize, but the AI service returned an invalid response. Please try again."

        if isinstance(output, list) and len(output) > 0:
            if "generated_text" in output[0]:
                answer = output[0]["generated_text"].strip()
                logger.info(f"Generated answer length: {len(answer)}")
                return answer
            else:
                logger.warning(f"No 'generated_text' in response: {output[0]}")
                return "I apologize, but the AI service returned an unexpected response format. Please try again."
        else:
            logger.warning(f"Unexpected response format: {output}")
            return "I apologize, but the AI service returned an unexpected response. Please try again."
            
    except requests.exceptions.Timeout:
        logger.error("FinGPT API request timed out")
        return "I apologize, but the AI service is taking too long to respond. Please try again."
    except requests.exceptions.ConnectionError:
        logger.error("FinGPT API connection error")
        return "I apologize, but I cannot connect to the AI service. Please check your internet connection and try again."
    except Exception as e:
        logger.error(f"Unexpected error calling FinGPT API: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return f"I apologize, but there was an unexpected error: {str(e)}"
    

def local_expense_analysis(question: str, expenses: List[Dict]) -> str:
    """
    Local expense analysis without AI - fallback when FinGPT is not available
    """
    if not expenses:
        return "No expenses found to analyze."

    # Calculate basic statistics
    total_amount = sum(e['amount'] for e in expenses)
    category_totals = {}
    date_totals = {}

    for expense in expenses:
        # Category analysis
        cat = expense['category']
        category_totals[cat] = category_totals.get(cat, 0) + expense['amount']

        # Date analysis
        date = expense['date']
        date_totals[date] = date_totals.get(date, 0) + expense['amount']

    # Find biggest expense
    biggest_expense = max(expenses, key=lambda x: x['amount'])

    # Find top category
    top_category = max(category_totals.items(), key=lambda x: x[1])

    # Analyze question and provide relevant answer
    question_lower = question.lower()

    if any(word in question_lower for word in ['biggest', 'highest', 'largest', 'most']):
        # Format date properly
        try:
            if isinstance(biggest_expense['date'], str):
                from datetime import datetime
                date_obj = datetime.fromisoformat(biggest_expense['date'].replace('Z', '+00:00'))
                formatted_date = date_obj.strftime('%B %d, %Y')
            else:
                formatted_date = biggest_expense['date'].strftime('%B %d, %Y')
        except:
            formatted_date = str(biggest_expense['date'])
            
        # Build supporting details dynamically
        supporting_details = []
        if biggest_expense.get('description') and biggest_expense['description'].strip():
            supporting_details.append(f"• Description: {biggest_expense['description']}")
        supporting_details.append(f"• Date: {formatted_date}")
        
        return f"""Your biggest expense is ₹{biggest_expense['amount']:.2f} for {biggest_expense['category']}.

Supporting Details:
{chr(10).join(supporting_details)}

Actionable Recommendations:
• Review if this expense was necessary
• Consider setting a budget limit for {biggest_expense['category']} category
• Look for ways to reduce similar expenses in the future"""

    elif any(word in question_lower for word in ['total', 'sum', 'all']):
        return f"""Your total expenses are ₹{total_amount:.2f}.

Supporting Details:
• Number of expenses: {len(expenses)}
• Top spending category: {top_category[0]} (₹{top_category[1]:.2f})
• Average expense: ₹{total_amount/len(expenses):.2f}

Actionable Recommendations:
• Track your spending patterns
• Set monthly budget goals
• Focus on reducing expenses in {top_category[0]} category"""

    elif any(word in question_lower for word in ['category', 'categories']):
        category_breakdown = "\n".join([f"• {cat}: ₹{amt:.2f}" for cat, amt in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)])
        return f"""Your spending by category:

Supporting Details:
{category_breakdown}

Actionable Recommendations:
• Focus on reducing expenses in {top_category[0]} category
• Consider setting category-specific budgets
• Review if all categories are necessary"""

    elif any(word in question_lower for word in ['save', 'reduce', 'cut', 'budget']):
        return f"""Here are ways to save money based on your spending:

Supporting Details:
• Your biggest expense category: {top_category[0]} (₹{top_category[1]:.2f})
• Your biggest single expense: ₹{biggest_expense['amount']:.2f} for {biggest_expense['category']}

Actionable Recommendations:
• Reduce spending in {top_category[0]} category
• Set a daily/weekly budget limit
• Track all expenses to identify patterns
• Consider alternatives for expensive items
• Review recurring expenses regularly"""

    else:
        return f"""Here's a summary of your expenses:

Supporting Details:
• Total spent: ₹{total_amount:.2f}
• Number of expenses: {len(expenses)}
• Top category: {top_category[0]} (₹{top_category[1]:.2f})
• Biggest expense: ₹{biggest_expense['amount']:.2f} for {biggest_expense['category']}

Actionable Recommendations:
• Monitor your spending patterns
• Set realistic budget goals
• Focus on reducing expenses in {top_category[0]} category
• Review expenses regularly to stay on track"""


def query_fingpt(question: str, expenses: List[dict]):
    """
    1. Upsert new/updated expenses to Pinecone
    2. Extract filters from query (user_id, date range, keywords)
    3. Query Pinecone for relevant context with filters and keywords
    4. Build prompt and send to FinGPT API
    5. Return LLM answer and context used
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        logger.info(f"Starting FinGPT query processing for question: {question}")
        logger.info(f"Number of expenses: {len(expenses)}")
        
        # Validate inputs
        if not question or not question.strip():
            logger.error("Empty question provided")
            return {"error": "Question cannot be empty"}
            
        if not expenses:
            logger.error("No expenses provided")
            return {"error": "No expenses provided to analyze."}

        # Validate expense structure
        for i, expense in enumerate(expenses):
            if not isinstance(expense, dict):
                logger.error(f"Expense {i} is not a dictionary: {type(expense)}")
                return {"error": f"Invalid expense format at index {i}"}
            
            required_fields = ['user_id', 'amount', 'category', 'description', 'date']
            missing_fields = [field for field in required_fields if field not in expense]
            if missing_fields:
                logger.error(f"Expense {i} missing fields: {missing_fields}")
                return {"error": f"Invalid expense data: missing {missing_fields}"}

        user_id = expenses[0]["user_id"]
        logger.info(f"Processing for user_id: {user_id}")

        # Step 1: Upsert expenses to Pinecone
        if expenses:
            try:
                logger.info("Upserting expenses to Pinecone...")
                upsert_expenses_to_pinecone(expenses)
                logger.info("Successfully upserted expenses to Pinecone")
            except ValueError as e:
                logger.error(f"Pinecone upsert error: {e}")
                return {"error": f"Failed to store expenses: {str(e)}"}
            except Exception as e:
                logger.error(f"Unexpected error during Pinecone upsert: {e}")
                return {"error": f"Storage error: {str(e)}"}

        # Step 2: Extract filters from query
        try:
            logger.info("Extracting filters from query...")
            filter_data = extract_filters_from_query(question, user_id)
            logger.info(f"Extracted filters: {filter_data}")
        except Exception as e:
            logger.error(f"Error extracting filters: {e}")
            return {"error": f"Failed to process query filters: {str(e)}"}
        
        # Step 3: Query Pinecone for relevant context
        try:
            logger.info("Querying Pinecone for relevant context...")
            results = query_user_expenses(
                index=index,
                user_id=user_id,
                query=question,
                top_k=5
            )
            logger.info(f"Retrieved {len(results)} results from Pinecone")
        except Exception as e:
            logger.error(f"Error querying Pinecone: {e}")
            return {"error": f"Failed to retrieve context: {str(e)}"}

        # Step 4: Format context
        try:
            context = format_context_from_results(results)
            
            # If no context from Pinecone, create fallback context from raw expenses
            if not context or context == "No relevant expense data found for your query.":
                logger.info("No Pinecone context available, creating fallback context from raw expenses")
                context_lines = []
                for expense in expenses:
                    # Format date properly
                    try:
                        if isinstance(expense['date'], str):
                            from datetime import datetime
                            date_obj = datetime.fromisoformat(expense['date'].replace('Z', '+00:00'))
                            formatted_date = date_obj.strftime('%B %d, %Y')
                        else:
                            formatted_date = expense['date'].strftime('%B %d, %Y')
                    except:
                        formatted_date = str(expense['date'])
                        
                    # Build context line dynamically
                    context_parts = [
                        f"Date: {formatted_date}",
                        f"Amount: ₹{expense['amount']:.2f}",
                        f"Category: {expense['category']}"
                    ]
                    
                    # Only add description if it exists and is not empty
                    if expense.get('description') and expense['description'].strip():
                        context_parts.append(f"Description: {expense['description']}")
                    
                    context_line = ", ".join(context_parts)
                    context_lines.append(context_line)
                context = "\n".join(context_lines)
                logger.info(f"Created fallback context with {len(expenses)} expenses")
            
            logger.info(f"Formatted context length: {len(context)} characters")
        except Exception as e:
            logger.error(f"Error formatting context: {e}")
            return {"error": f"Failed to format context: {str(e)}"}

        # Step 5: Build prompt
        try:
            prompt = build_prompt(question, context)
            logger.info(f"Built prompt length: {len(prompt)} characters")
        except Exception as e:
            logger.error(f"Error building prompt: {e}")
            return {"error": f"Failed to build prompt: {str(e)}"}

        # Step 6: Call FinGPT API
        try:
            logger.info("Calling FinGPT API...")
            answer = call_fingpt_api(prompt)
            logger.info(f"FinGPT response length: {len(answer)} characters")
            
            # Check if the answer indicates an error and use fallback
            if any(error_indicator in answer.lower() for error_indicator in [
                'not properly configured', 'authentication issue', 'permissions', 
                'forbidden', 'not available', 'unavailable', 'error with the ai service'
            ]):
                logger.warning("FinGPT API returned error, using local analysis fallback")
                answer = local_expense_analysis(question, expenses)
                logger.info("Local analysis completed successfully")
                
        except Exception as e:
            logger.error(f"FinGPT API error: {e}")
            logger.info("Using local analysis fallback due to API error")
            answer = local_expense_analysis(question, expenses)
            logger.info("Local analysis completed successfully")

        # Step 7: Return result
        result = {
            "answer": answer,
            "context_used": context,
            "metadata": filter_data,
            "num_chunks": len(results)
        }
        
        logger.info("Successfully completed FinGPT query processing")
        return result
        
    except Exception as e:
        logger.error(f"Unexpected error in query_fingpt: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return {"error": f"Unexpected error: {str(e)}"}
