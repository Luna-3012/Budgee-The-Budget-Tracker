import uvicorn

if __name__ == "__main__":
    print("🚀 Starting BudgetBot Backend...")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📚 API docs will be at: http://localhost:8000/docs")
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
