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

### Troubleshooting Common Issues

If you encounter any issues while running the application:

1. **Dependencies Issues**:
   - If you see Chakra UI/Framer Motion related errors, try:
   ```bash
   npm install framer-motion@11
   ```
   - Then restart the development server

2. **Port Already in Use**:
   - The app will automatically try the next available port (e.g., 3001)
   - You can manually specify a port:
   ```bash
   npm run dev -- -p 3002
   ```

3. **API Key Issues**:
   - Ensure your `.env.local` file is in the root directory
   - Restart the development server after adding/modifying the API key

4. **General Issues**:
   - Try clearing npm cache: `npm cache clean --force`
   - Delete `node_modules` and run `npm install` again
   - Ensure you're using Node.js version 18.x

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