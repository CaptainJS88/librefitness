# Libre Fitness (Work in Progress)

Hi, I'm Abhishek. This is a work-in-progress fitness and nutrition tracker I'm currently building. 

I started this project to solve my own frustrations with bloated, ad-heavy diet apps. My goal is to create a clean, fast, zero-friction way to log meals and track macros. It also serves as a hands-on environment to deepen my experience with modern mobile-first application development.

## Tech Stack
* **Framework:** React Native with Expo (using Expo Router for file-based navigation)
* **Language:** TypeScript
* **Backend as a Service:** Supabase (PostgreSQL)
* **Authentication:** Supabase Auth + Expo Auth Session
* **External API:** USDA FoodData Central API
* **State Management:** Zustand (implementation in progress)

## Current Status
This project is in active development. Here is what has been built so far:
* **Database Architecture:** A robust relational schema (`profiles`, `daily_logs`, `food_entries`) secured entirely via strict Row Level Security (RLS) policies on the database level.
* **Authentication:** End-to-end OAuth flow implemented (Google Sign-In) alongside standard Email/Password authentication.
* **Mobile-First UI:** Built modular, reusable presentational components for the daily macro dashboard and meal categorization.
* **API Integration:** Wired up an asynchronous client to fetch and parse raw nutritional data directly from the USDA database.

## Next Steps
* Building the Zustand store to manage high-frequency state updates (like searching for foods and calculating remaining daily macros).
* Completing the search modal to tie the USDA API data directly to the user's daily log in Supabase.
* Implementing a "Saved Meals" feature to allow one-tap logging for recurring daily meals.

Feel free to poke around the source code!