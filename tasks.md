# Orvanthis Development Sprint

Goal: Build the core MVP of the Orvanthis AI Opportunity Engine.

The MVP must allow users to:
- generate AI opportunity reports
- view opportunity scores
- store saved reports
- reuse previous searches
- explore emerging opportunity areas

---

# CURRENT SPRINT

## Task 1
Title: Recent Searches
Owner: Engineer Agent
Status: Completed

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

## Task 2
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

Definition of Done:
Saved reports feel like a clean intelligence feed.

---

## Task 3
Title: Opportunity Feed
Owner: Product Agent + Engineer Agent
Status: In Progress

Goal:
Generate suggested opportunities automatically.

Requirements:
- show 3–5 trending opportunities
- auto-generated when dashboard loads
- displayed as cards
- clickable → generates report

Definition of Done:
Users see suggested opportunities without searching.

---

## Task 4
Title: Dashboard Polish Pass
Owner: Engineer Agent + Design Agent
Status: In Progress

Goal:
Upgrade the dashboard to premium, executive-level UI quality.

Requirements:
- fix cramped sidebar spacing
- improve market card alignment and spacing
- improve opportunity feed card consistency
- unify padding, font hierarchy, and spacing
- maintain current functionality

Definition of Done:
Dashboard feels clean, premium, and visually consistent.

---

## Task 5
Title: Watchlist Alerts System
Owner: Engineer Agent
Status: Completed

Goal:
Generate intelligent alerts based on watchlists + market + opportunity feed.

Requirements:
- generate alerts dynamically
- categorize alerts (positive, caution, monitor)
- clickable → runs report
- clean UI card display

Definition of Done:
Alerts update dynamically and feel useful and actionable.

---

## Task 6
Title: Market Data Reliability
Owner: Engineer Agent
Status: In Progress

Goal:
Make market data stable, resilient, and reliable.

Requirements:
- fallback to last known good data
- avoid UI breaking on partial data
- improve refresh stability
- ensure consistent prediction output

Definition of Done:
Market panel remains stable even during API issues.

---

## Task 7
Title: Authentication System
Owner: Engineer Agent
Status: Pending

Goal:
Add user accounts.

Requirements:
- signup
- login
- protect dashboard
- store reports per user

Definition of Done:
Users must log in to access dashboard.

---

## Task 8
Title: Stripe Billing
Owner: Product Agent + Engineer Agent
Status: Pending

Goal:
Monetize Orvanthis.

Requirements:
- free plan
- pro plan
- paywall for advanced reports

Definition of Done:
Users can upgrade to Pro.

---

# BACKLOG

Future features to build after MVP:

## Intelligence Layer
- AI market scanners
- industry trend detection
- startup discovery engine
- VC deal tracker

## User Features
- watchlists v2 (grouped + weighted)
- opportunity alerts (push + email)
- saved strategy playbooks
- export reports (PDF)

## AI System Expansion
- multi-agent system (Engineer, Product, Analyst)
- autonomous research agent
- continuous opportunity monitoring
- competitive intelligence tracking

## Platform Growth
- mobile optimization
- performance optimization
- caching layer
- analytics dashboard

---

# AGENT RULES

All AI agents working on Orvanthis must:

- follow one task at a time
- never break existing functionality
- preserve premium UI quality
- avoid unnecessary dependencies
- explain all changes clearly
- wait for approval on major changes

---

# CURRENT PRIORITY ORDER

1. Dashboard Polish Pass
2. Market Data Reliability
3. Opportunity Feed Completion
4. Saved Reports Improvements
5. Authentication System

---

# NOTES

- Always prioritize product quality over speed
- UI/UX should feel premium (Bloomberg / Apple-level polish)
- Every feature must feel useful, not just functional

