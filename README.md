# Score: Litigation Analytics Tool

A powerful web application designed to empower criminal defense attorneys with empirical data-driven insights. Score leverages trial court data from Massachusetts to help attorneys analyze judge/courthouse leniency and bias, enabling more effective legal strategies.

**Live deployment:** [score.law](https://score.law)

> **IMPORTANT:** This application requires a MySQL database connection to function properly. See the [Database Setup](#database-setup) section for details.

## Features

- **Judge & Courthouse Analysis:** Analyze and compare leniency patterns across judges and courts
- **Motion Outcome Predictions:** Identify which motions are likely to be filed and granted/denied
- **Sentencing Analytics:** View average sentences to inform sentencing strategies  
- **Trial Type Comparison:** Compare results across bench, jury, or no trial cases
- **Bail Decision Forecasting:** Predict potential bail decisions with empirical data
- **Disposition Predictions:** Provide clients with data-backed insights on likely case outcomes

## Prerequisites

- Node.js (v16 or higher)
- MySQL database
- Git for cloning the repository

## Installation

### Clone the repository
```bash
git clone https://github.com/your-username/litigation-analytics.git
cd litigation-analytics
```

### Install dependencies
```bash
npm install
```

### Database Setup
The application requires a MySQL database initiated with multiple tables using the schemas in the init.sql file. These must be initialized in a sql server, and you should then update the config in .env to route to the correct server. This database should be initialized with information from the corresponding sifter module, included in this repository: https://github.com/falktravis/lawya-sifter

### Environment Variables Configuration

Create a `.env` file in the root directory with the following variables:

```
DB_HOST=your_database_host
DB_USER=your_database_username
DB_PASS=your_database_password
DB_NAME=litigation_analytics
DB_PORT=3306
NEXT_PUBLIC_JWT_SECRET=your_jwt_secret_key
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_analytics_key
```

Variable descriptions:
- `DB_HOST`: MySQL database host (e.g., localhost or RDS endpoint)
- `DB_USER`: Database username (e.g., admin)
- `DB_PASS`: Database password
- `DB_NAME`: Database name (litigation_analytics)
- `DB_PORT`: Database port (usually 3306 for MySQL)
- `NEXT_PUBLIC_JWT_SECRET`: Secret key for JWT authentication
- `NEXT_PUBLIC_POSTHOG_KEY`: PostHog analytics tracking key

## User Registration

To create a new user account, run:

```bash
npm run register-user your_email@example.com your_password
```

The password must be at least 8 characters long, and the email must be in a valid format.

## Usage

### Login
1. Navigate to the application URL
2. Enter your email and password
3. Click "Login" to access the application

### Search for Case Data
1. Use the search form to select a courtroom, judge, and/or charges
2. Click "Submit" to retrieve analytics based on your criteria

### Viewing Results
The results page displays data in four main categories:

1. **Dispositions:** Shows case outcomes and trial types
2. **Sentences:** Displays sentence types and averages
3. **Bail Decisions:** Shows bail amount distributions and averages
4. **Motions:** Breaks down motion outcomes by type and party

## Development

### Running in Development Mode

```bash
npm run dev
```

This starts the development server with Turbopack enabled. Open [http://localhost:3000](http://localhost:3000) to view the application.

### ESLint Configuration

The project uses a custom ESLint configuration with several rules disabled for development convenience. The configuration is in `eslint.config.mjs` and disables the following rules:
- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-unused-vars`
- `react-hooks/exhaustive-deps`
- `@typescript-eslint/no-empty-object-types`

## Deployment

The application is currently deployed at [score.law](https://score.law).

## Code Structure

The project follows the standard Next.js application structure with app router:

- `app/`: Main application code and routes
  - `(routes)/`: Page routes including login and results
  - `api/`: API endpoints for charges, judges, login, etc.
- `components/`: React components organized by function
  - Visualization components for different data types
  - UI elements like NavBar, Footer, etc.
- `scripts/`: Utility scripts including user registration
- `types/`: TypeScript type definitions
- `utils/`: Helper functions and utilities

The codebase is modular, with separate components for different visualizations and data displays.
