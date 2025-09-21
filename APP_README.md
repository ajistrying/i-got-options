# Stock Options Research Hub

A Nuxt 3 application for searching Reddit discussions about stock tickers to build a comprehensive dossier for options trading decisions.

## Features

- **Ticker Search**: Enter any stock ticker to search across multiple subreddits
- **Reddit Integration**: Searches across favorite options/trading subreddits
- **Data Storage**: Automatically stores search results in local Supabase database
- **Dossier Building**: Accumulates historical search data for each ticker
- **Raw JSON View**: Displays search results as formatted JSON for analysis

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, Nuxt UI
- **Backend**: Nitro server, Supabase (local)
- **Database**: PostgreSQL (via Supabase)
- **API**: Reddit public JSON API

## Setup & Running

1. **Start Supabase** (already running):
   ```bash
   npx supabase start
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Run development server**:
   ```bash
   yarn dev
   ```
   
   The app is currently running on: **http://localhost:3003**

## Environment Variables

Located in `.env`:
- `SUPABASE_URL`: Local Supabase API URL
- `SUPABASE_PUBLISHABLE_KEY`: Supabase anon key
- `REDDIT_USERNAME`: Your Reddit username (for future OAuth implementation)
- `REDDIT_SECRET_TOKEN`: Reddit API token (for future OAuth implementation)

## Database Schema

### `favorite_subreddits`
- Stores list of subreddits to search
- Default subreddits: wallstreetbets, options, stocks, investing, etc.

### `ticker_searches`
- Stores all search results with JSONB data
- Builds dossier over time for each ticker

## Current Status

✅ Basic UI with ticker search functionality
✅ Reddit search integration (using public API)
✅ Local Supabase database setup
✅ Search results storage and retrieval
✅ Raw JSON display of results
✅ Dossier view for historical searches

## Known Issues

- File watcher warning (EMFILE) - doesn't affect functionality
- Using Reddit public API (rate limited) - OAuth implementation ready for future

## Next Steps

- Implement Reddit OAuth for higher rate limits
- Add AI agents for sentiment analysis
- Integrate options data (volatility, Greeks)
- Enhanced UI for data visualization
- Implement filtering and sorting features

## Usage

1. Open http://localhost:3003 in your browser
2. Enter a stock ticker (e.g., AAPL, GME, SPY)
3. Click "Search Reddit" 
4. View results in formatted or raw JSON format
5. Check the dossier section to see historical searches

The app will search across your favorite subreddits and store all results locally for building a comprehensive information dossier about each ticker.