# Lead Finder Hub

Build a simple, clean full-stack web application called "Lead Finder".

Purpose: I want to search for businesses by keyword and location, retrieve business information from a compliant Google Maps/Google Places data source, filter the results, and export the leads.

Example search: "Restaurants in Los Angeles"

Main UI:

Simple modern dashboard

Search input: Business type / keyword

Location input: City, State, Country

Search button

Optional radius

Results count

Results should appear in a clean table with:

Business Name

Category

Address

Phone

Website

Google Maps URL

Rating

Number of Reviews

Website Available: Yes/No

Lead Status

Important filters:

No website

Has website

Rating

Number of reviews

Category

Location

Lead workflow:

User searches "Restaurants in Los Angeles"

Fetch available business results from the configured compliant API/data provider

Display results in the dashboard

Allow selecting individual leads or selecting all

Allow exporting selected/all results to CSV and Excel

Remove duplicate businesses

Show loading/progress state

Handle API errors and rate limits properly

Lead qualification: Automatically mark "No Website" when the returned business record has no website. Make this filter very easy to use because the main purpose is finding businesses without websites.

Frontend:

Very simple professional UI

Responsive

Search bar at the top

Filters below it

Results table

Pagination

Export buttons

No unnecessary animations

Backend:

Secure API layer

Keep API keys on the server only

Environment variables for API credentials

Proper error handling

Pagination

Rate-limit handling

Do not use browser automation, CAPTCHA bypass, proxy rotation, or methods intended to evade Google's restrictions.

Tech:

Next.js

TypeScript

Tailwind CSS

API routes/server actions

PostgreSQL or Supabase for storing saved leads

CSV/XLSX export

Add a "Saved Leads" section where I can view previously saved leads.

Each lead should have:

Sa ...

Today at 6:55 AM

Thought for 15s

I'll build this on the project's stack (TanStack Start + React + TypeScript + Tailwind), which plays the same role as Next.js here. Starting with the backend.

Added lead finder app

Lead Finder is live: search by keyword and city, filter with a one-click "No website" button, select leads, export to CSV or Excel, and save them to the "Saved leads" page with status, contacted checkbox, notes, and delete.

Right now it returns realistic sample businesses so you can test everything. To pull real Google Places data, I just need a Google Places API key saved securely — say the word and I'll set that up.

Today at 7:02 AM

Fix error

Used 3 tools

The blank screen came from a stale preview cache serving two mismatched copies of React; clearing it and restarting fixed it — the app loads with no errors.

Set up the Google Places API key securely and replace the mock businesses with real search results. and make easy to sale employe face make easy flow

Today at 7:11 AM

Checked available Google connections

Easiest secure route: connect Google Maps Platform — the key stays on the server and you don't have to paste anything. I'm opening the connect card now.

Used 2 tools

bro i click the maps and open the page but page shows error not open

Today at 7:13 AM

Acknowledged the broken Map link

Noted — the Map links are broken because the sample businesses aren't real. I'm switching to real Google data now.

Fixed broken Map links

Real Google data is live — searches now return actual businesses and the Map links open real Google Maps pages.

For sales staff I added one-click quick searches (Plumbers, Dentists, Roofers, and more), and when every business found already has a website you now get a clear message with a "Show all businesses" button instead of an empty table.



bro i maid the project but ai credits has full so you make this and check properly i want to lead finder system simply but proper please make this easy sale employe face

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3b0b9685-0c57-427b-8fa6-e7f0828f84ed).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
