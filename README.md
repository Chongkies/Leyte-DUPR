# Leyte-DUPR

A pickleball player directory and rating platform for Leyte, following a DUPR-like (Dynamic Universal Pickleball Rating) system. Players can be searched, matches can be logged, and live ratings are calculated based on match results.

## Overview

Leyte-DUPR brings a structured, DUPR-style rating system to the local pickleball community. Representatives manage their own courts and player rosters, matches are entered into the system, and each player's live rating updates based on match outcomes — following DUPR's rating algorithm.

From the homepage, anyone can search for a player by name to view:
- Their background/profile
- Match history
- Live DUPR rating

## Tech Stack

- HTML5
- CSS3
- JavaScript (vanilla)

## Features

- **Player Search** — search by name from the homepage
- **Player Profiles** — background info, match history, and current live rating
- **Match Entry** — log match results into the system
- **Live Rating Calculation** — ratings update dynamically based on DUPR-style algorithm
- **Court & Representative Management** — representatives manage their own court and associated players

## Getting Started

### Prerequisites
No build tools required — this is a static site.

### Running Locally

**Option A: Open directly**
Simply open `index.html` in your browser.

**Option B: Use a local server (recommended for consistent behavior)**
```bash
# Using Python
python -m http.server 8000

# Or using Node's http-server
npx http-server .
```
Then visit `http://localhost:8000` in your browser.

## Project Structure

```
Leyte-DUPR/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
└── README.md
```

<!-- Update the structure above to match your actual folder layout -->

## Rating System

<!-- If you'd like, expand this section with specifics on how your DUPR-style
algorithm works — e.g. how match results affect rating, weighting factors,
provisional vs. established ratings, etc. -->

## Deployment

<!-- Add notes here if this is deployed via GitHub Pages, Netlify, Vercel, etc. -->

## License

<!-- Add license info, or note if this is private/proprietary -->

## Maintainer

Developed and maintained by Chongkies.
