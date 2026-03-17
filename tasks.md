# Orvanthis Development Sprint

Goal: Build the core MVP of the Orvanthis AI Strategic Intelligence Platform.

The MVP must allow users to:
- generate AI strategic reports
- view opportunity scores
- store saved reports
- reuse previous searches
- explore emerging opportunity areas
- monitor live market signals
- track personalized watchlists
- receive intelligence-driven alerts

---

# CURRENT SPRINT

## Task 1
Title: Watchlist Alerts
Owner: Engineer Agent + Intelligence Agent
Status: In Progress

Goal:
Create personalized alerts based on the user’s watchlists and current market/opportunity context.

Requirements:
- alerts panel reflects watchlist topics
- alerts feel premium and useful
- alerts are not generic filler
- alerts fit the executive dashboard UI
- alerts update based on watchlist-related context

Definition of Done:
Users see useful alert cards that connect directly to their watchlists.

---

## Task 2
Title: Market Reliability Upgrade
Owner: Engineer Agent
Status: In Progress

Goal:
Improve market signal consistency and reduce weak or empty readings.

Requirements:
- preserve last known good market state
- reduce unstable pulse switching
- improve fallback handling for partial data
- keep market cards readable and premium
- prevent broken-looking states when data is delayed

Definition of Done:
Market cards remain stable and useful even when live API data is incomplete.

---

## Task 3
Title: Recent Searches
Owner: Engineer Agent
Status: Active

Goal:
Track user search queries and display them in the sidebar.

Requirements:
- store last 8 searches
- no empty searches
- no duplicate searches back-to-back
- clicking a search fills the search box
- keep dark premium UI

Definition of Done:
Recent searches appear in the sidebar and are clickable.

---

## Task 4
Title: Saved Reports Improvements
Owner: Engineer Agent + Design Agent
Status: Pending

Goal:
Make saved reports easier to browse and reload.

Requirements:
- highlight active report
- show short preview snippet
- improve timestamp formatting
- improve sidebar layout
- keep premium intelligence-feed styling

Definition of Done:
Saved reports feel like a clean intelligence feed.

---

## Task 5
Title: Opportunity Feed Refinement
Owner: Product Agent + Engineer Agent
Status: Active

Goal:
Improve the AI-generated opportunity feed so it feels more useful and personalized.

Requirements:
- show suggested opportunities automatically
- tie feed quality to watchlists where possible
- keep cards premium and easy to scan
- clicking a feed item should open a strong report
- improve usefulness for business users

Definition of Done:
Users see useful suggested opportunities without needing to search first.

---

## Task 6
Title: Strategic Decision Mode
Owner: Product Agent + Engineer Agent
Status: Pending

Goal:
Allow users to ask direct decision questions.

Requirements:
- support prompts like:
  - Should I enter this market?
  - Should I build this product?
  - Should I pursue this opportunity?
- responses must be concise, structured, and strategic
- preserve premium report style
- focus on business usefulness

Definition of Done:
Users can generate decision-focused strategic analysis, not just opportunity summaries.

---

## Task 7
Title: Assistant Mode
Owner: Product Agent + Engineer Agent
Status: Pending

Goal:
Expand Orvanthis from a report tool into a personal strategic assistant.

Requirements:
- support more direct user guidance
- help interpret opportunities and risks
- fit the executive dashboard style
- feel distinct from generic chatbots

Definition of Done:
Orvanthis starts behaving like a strategic assistant, not just a report generator.

---

## Task 8
Title: Agent Task Runner Panel
Owner: Product Agent + Engineer Agent
Status: Pending

Goal:
Create a panel in the platform showing current AI work structure.

Requirements:
- show current task
- show owner
- show status
- show next task
- match premium executive UI

Definition of Done:
The dashboard includes a visible task runner panel for AI workflow visibility.

---

## Task 9
Title: Authentication System
Owner: Engineer Agent
Status: Later

Goal:
Add user accounts.

Requirements:
- signup
- login
- protect dashboard
- store reports per user

Definition of Done:
Users must log in to access their own dashboard and saved data.

---

## Task 10
Title: Stripe Billing
Owner: Product Agent + Engineer Agent
Status: Later

Goal:
Monetize Orvanthis.

Requirements:
- free plan
- pro plan
- paywall for advanced reports
- preserve premium experience

Definition of Done:
Users can upgrade to Pro.

---

# BACKLOG

Future features to build after MVP:
- Watchlist intelligence scoring
- Opportunity alerts
- AI market scanners
- Startup discovery engine
- VC deal tracker
- Industry trend detection
- Competitive intelligence
- Regulatory intelligence
- Opportunity graph engine
- Enterprise team workspaces


