# AI TruthLens – Hallucination Detection & Validation Playground

## Overview
**AI TruthLens** is a college-level educational web application built to explore, detect, and analyze AI hallucinations through side-by-side model comparison. By utilizing a clean, modern UI built on Next.js and Tailwind CSS, users can send queries to multiple language models simulatenously (e.g. GPT-4o, Gemini) and meticulously flag their outputs for inaccuracies.

## Features Built
1. **Multi-Model Query System**: Send simultaneous requests to distinct AI APIs for comparative analysis. (Currently runs on mock data for easy un-authenticated local running).
2. **Interactive Hallucination Tagging**: Users can classify errors in AI behavior (Fabricated Facts, Contradictions, Overconfidence, Unsupported Claims).
3. **Rigorous Validation Methods**: Select the scientific validation method used to verify responses (e.g., Cross-Model Comparison, Logical Reasoning).
4. **Local JSON Data Pipeline**: Fully functioning serverless backend via Next.js API Routes (`/api/history`) that reads/writes data tracking reliably into `src/data/db.json` without requiring external Postgres/Mongo setup.
5. **Real-time Analytics Dashboard**: Tracks overall AI reliability dynamically, summing error histories and displaying past interactions.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Frontend library**: React.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage Database**: Managed Local JSON Store (`fs` API routing in Node.js)

## How to Run it Locally

1. First, navigate to the project directory:
   ```bash
   cd ai-truthlens
   ```

2. Make sure you have installed the required dependencies via NPM:
   ```bash
   npm install
   ```

3. Spin up the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open your browser to http://localhost:3000 .
5. Enter a question to trigger the AI mock responses.
6. Checkmark tags to report hallucinations, select an evaluation method, and save to your Dashboard!

## Academic Use
This repository acts as a functional demonstration for Generative AI coursework, tackling modules on "Ethics, Bias & Explainability" and "Discriminative vs Generative Models".
