import yfinance as yf
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import requests

# 1. Initialize the AI
MODEL_NAME = "ProsusAI/finbert"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)

def get_symbol_from_name(name):
    """
    Converts a company name (e.g., 'Google') into a ticker (e.g., 'GOOG').
    """
    try:
        url = "https://query2.finance.yahoo.com/v1/finance/search"
        user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        params = {"q": name, "quotes_count": 1, "country": "United States"}
        
        res = requests.get(url=url, params=params, headers={'User-Agent': user_agent})
        data = res.json()
        
        if data['quotes']:
            return data['quotes'][0]['symbol']
    except Exception:
        pass
    return name # Fallback to original input if search fails

def get_hype_analysis(input_query):
    """
    Now handles both SYMBOLS (AAPL) and NAMES (Apple).
    """
    # Step A: Convert Name to Symbol
    symbol = get_symbol_from_name(input_query)
    print(f"--- Analyzing: {symbol} (Search: {input_query}) ---")

    # Step B: Fetch News Headlines
    ticker = yf.Ticker(symbol)
    news = ticker.news
    if not news:
        return {"sentiment_score": 0.0, "sentiment_label": "Neutral", "symbol": symbol}

    headlines = []
    for item in news[:5]:
        content = item.get('content', {})
        title = content.get('title')
        if title:
            headlines.append(title)

    if not headlines:
        return {"sentiment_score": 0.0, "sentiment_label": "Neutral", "symbol": symbol}

    # Step C: AI Processing
    inputs = tokenizer(headlines, padding=True, truncation=True, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)

    # Step D: Calculate Hype Score
    total_score = 0
    for p in probs:
        pos_val, neg_val = p[0].item(), p[1].item()
        total_score += (pos_val - neg_val)

    avg_score = total_score / len(headlines)
    label = "Bullish" if avg_score > 0.2 else "Bearish" if avg_score < -0.2 else "Neutral"

    return {
        "symbol": symbol,
        "sentiment_score": round(avg_score, 2),
        "sentiment_label": label
    }

if __name__ == "__main__":
    query = input("Enter Company Name or Ticker: ")
    print(get_hype_analysis(query))