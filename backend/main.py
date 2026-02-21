from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
from sentiment import get_hype_analysis # Your AI Module

app = FastAPI(title="Stock Data & Indicator API")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Stock API! Go to /docs to see the API documentation."}

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_rsi(data: pd.Series, window: int = 14):
    """Calculates the Relative Strength Index (RSI)."""
    delta = data.diff()
    gain = delta.clip(lower=0)
    loss = -1 * delta.clip(upper=0)
    ema_gain = gain.ewm(com=window-1, adjust=False).mean()
    ema_loss = loss.ewm(com=window-1, adjust=False).mean()
    rs = ema_gain / ema_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

@app.get("/api/stock")
def get_stock_data(symbol: str):
    try:
        # 1. Initialize yfinance Ticker
        ticker_obj = yf.Ticker(symbol.upper())
        
        # 2. Fetch Info
        info = ticker_obj.info
        if 'regularMarketPrice' not in info and 'currentPrice' not in info:
             raise HTTPException(status_code=404, detail="Stock symbol not found.")

        current_price = info.get('currentPrice', info.get('regularMarketPrice', 0))
        
        # 3. Fetch Historical Data
        hist = ticker_obj.history(period="1y")
        if hist.empty:
            raise HTTPException(status_code=404, detail="Historical data not found.")

        # 4. Calculate Technical Indicators
        hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
        hist['SMA_50'] = hist['Close'].rolling(window=50).mean()
        hist['RSI'] = calculate_rsi(hist['Close'])

        latest_data = hist.iloc[-1]
        sma_20 = latest_data['SMA_20']
        sma_50 = latest_data['SMA_50']
        rsi_value = latest_data['RSI']

        # 5. Generate Technical Signal
        signal = "Sideways"
        if pd.notna(sma_20) and pd.notna(sma_50):
            if sma_20 > sma_50:
                signal = "Uptrend"
            elif sma_20 < sma_50:
                signal = "Downtrend"

        # 6. Format Candle Data
        recent_hist = hist.tail(30).copy()
        recent_hist.reset_index(inplace=True)
        recent_hist['Date'] = recent_hist['Date'].dt.strftime('%Y-%m-%d')
        recent_hist = recent_hist.replace({np.nan: None})
        candles = recent_hist[['Date', 'Open', 'High', 'Low', 'Close', 'Volume']].to_dict(orient='records')

        # --- STEP 7: CALL YOUR AI SENTIMENT MODULE ---
        # This takes the symbol from the request and gets the "Hype"
        sentiment_data = get_hype_analysis(symbol)

        # 8. Construct and Return JSON Payload (Now including Sentiment)
        return {
            "symbol": symbol.upper(),
            "price_data": {
                "current_price": current_price,
                "high_52w": info.get('fiftyTwoWeekHigh'),
                "low_52w": info.get('fiftyTwoWeekLow'),
                "pe_ratio": info.get('trailingPE'),
                "pb_ratio": info.get('priceToBook')
            },
            "indicators": {
                "sma_20": round(sma_20, 2) if pd.notna(sma_20) else None,
                "sma_50": round(sma_50, 2) if pd.notna(sma_50) else None,
                "rsi_14": round(rsi_value, 2) if pd.notna(rsi_value) else None
            },
            "technical_signal": signal,
            "sentiment": sentiment_data, # <--- NEW: AI results added here
            "candle_data": candles
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))