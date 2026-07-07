---
description: Steps to add and use the Doubles Match Logger for recording 4-player doubles matches and updating dynamic ratings
---

# Doubles Match Logger - Setup & Usage Guide

## Quick Start

1. Open assessment.html in a browser
2. Login as committee member
3. Scroll to "Record Tournament Match (Doubles)" section

## How to Record a Doubles Match

1. Select Players
   - Team A: Choose Player 1 and Player 2
   - Team B: Choose Player 1 and Player 2
   - Same player cannot be selected twice (validation enforced)

2. Enter Final Scores
   - Team A Score: e.g., 11
   - Team B Score: e.g., 5
   - Winner determined automatically (higher score wins)
   - Ties are not allowed

3. Select Tournament Type
   - Minor: 1.0x weight
   - Major: 1.5x weight

4. Review Match Preview
   - Shows calculated rating changes
   - Displays spread and weight multipliers
   - Green = winning team gain
   - Red = losing team loss

5. Click "Record Doubles Match & Update Ratings"

## Rating Calculation Formula

```
spread = (winnerScore - loserScore) / winnerScore
ratingChange = 0.05 * spread * tournamentWeight

Winning team: +ratingChange (each player)
Losing team: -ratingChange (each player)
```

## Data Storage

- All 4 player documents updated atomically via writeBatch()
- Global match record saved to "matches" collection
- Individual match history pushed to each player's "matchHistory" sub-collection
- All ratings stored to 3 decimal places (.toFixed(3))

## Troubleshooting

- "Please select all 4 players" → Ensure all dropdowns have selections
- "The same player cannot be selected twice" → Choose 4 different players
- "Scores cannot be tied" → Enter different scores for each team
- "One or more players not found" → Refresh player list with Clear button
