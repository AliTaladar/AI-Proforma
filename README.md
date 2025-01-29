# AI Proforma

A financial analysis tool that combines proforma tables with AI-powered insights.

## Features

- Interactive financial tables for revenue, expenses, and lots
- AI-powered financial analysis using GPT-4
- Real-time financial calculations (IRR, NPV, Payback Period)
- Visual charts for trend analysis
- Dark/Light mode support

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a `.env.local` file with your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```
4. Run the development server:
```bash
npm run dev
```

## Deployment

The application is deployed on Heroku. To deploy your own instance:

1. Create a new Heroku app
2. Set the OpenAI API key:
```bash
heroku config:set OPENAI_API_KEY=your_api_key_here
```
3. Deploy the application:
```bash
git push heroku main
```

## Tech Stack

- Next.js 14
- TypeScript
- Chakra UI
- OpenAI API
- Recharts for data visualization
- Financial.js for calculations