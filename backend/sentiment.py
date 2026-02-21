import yfinance as yf
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# 1. Initialize the AI (This runs once when the backend starts)
MODEL_NAME = "ProsusAI/finbert"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

def get_hype_analysis(symbol):
    """
    ANALYSIS ENGINE: Works for ANY symbol passed from the backend.
    """
    # A. Fetch News Headlines for the specific symbol provided
    ticker = yf.Ticker(symbol)
    news = ticker.news
    
    if not news:
        return {"sentiment_score": 0.0, "sentiment_label": "Neutral"}

    # B. Extract titles (Fixed for new yfinance structure)
    headlines = []
    for item in news[:5]:
        content = item.get('content', {})
        title = content.get('title')
        if title:
            headlines.append(title)

    if not headlines:
        return {"sentiment_score": 0.0, "sentiment_label": "Neutral"}

    # C. AI Processing
    inputs = tokenizer(headlines, padding=True, truncation=True, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)

    # D. Calculate Score
    total_score = 0
    for p in probs:
        pos_val = p[0].item()
        neg_val = p[1].item()
        total_score += (pos_val - neg_val)

    avg_score = total_score / len(headlines)

    # E. Labeling
    if avg_score > 0.2:
        label = "Bullish"
    elif avg_score < -0.2:
        label = "Bearish"
    else:
        label = "Neutral"

    return {
        "sentiment_score": round(avg_score, 2),
        "sentiment_label": label
    }

# --- CHANGE 2: MOVE TESTING HERE ---
if __name__ == "__main__":
    # This block now asks for input, proving the code is dynamic.
    # It will NOT run when the backend imports this file.
    user_input = input("Enter ticker to test: ").upper()
    print(f"Testing {user_input}...")
    print(get_hype_analysis(user_input))