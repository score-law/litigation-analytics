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
The application requires a MySQL database with the following schema:

```sql
CREATE TABLE `charges` (
  `charge_id` smallint NOT NULL AUTO_INCREMENT,
  `chapter_id` smallint DEFAULT NULL,
  `title_id` smallint DEFAULT '0',
  `name` varchar(100) DEFAULT NULL,
  `mgl_code` varchar(45) DEFAULT NULL,
  `chapter` varchar(10) DEFAULT '0',
  `description` varchar(250) DEFAULT NULL,
  `severity` tinyint DEFAULT '0',
  `type` enum('drug','vehicle','person','sexual','property','public_order','weapons','other') DEFAULT NULL,
  `degree` enum('None','Misd.','Felony') DEFAULT 'None',
  `hoc_min` varchar(45) DEFAULT NULL,
  `hoc_max` varchar(45) DEFAULT NULL,
  `sp_min` varchar(45) DEFAULT NULL,
  `sp_max` varchar(45) DEFAULT NULL,
  `total_cases` mediumint unsigned DEFAULT NULL,
  PRIMARY KEY (`charge_id`),
  UNIQUE KEY `id_UNIQUE` (`charge_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4782 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `judges` (
  `judge_id` int unsigned NOT NULL AUTO_INCREMENT,
  `first` varchar(25) DEFAULT NULL,
  `middle` varchar(10) DEFAULT NULL,
  `last` varchar(25) DEFAULT NULL,
  `total_cases` mediumint unsigned DEFAULT NULL,
  PRIMARY KEY (`judge_id`),
  UNIQUE KEY `judge_id_UNIQUE` (`judge_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4166 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `motion_data` (
  `specification_id` int unsigned NOT NULL,
  `motion_id` enum('dismiss','suppress','bill of particulars','discovery','speedy','bail','dangerousness','amend charge','continue','funds','protect','uncharged conduct','sequester','nolle prosequi','withdraw','obtain','travel','third party records','virtual','record-seal','record-medical','record-criminal','other') NOT NULL,
  `party` enum('defendant','commonwealth','probation','victim','non-party','surety','both parties') NOT NULL,
  `accepted` mediumint unsigned DEFAULT NULL,
  `denied` mediumint unsigned DEFAULT NULL,
  `no_action` mediumint unsigned DEFAULT NULL,
  `advisement` mediumint unsigned DEFAULT NULL,
  `unknown` mediumint unsigned DEFAULT NULL,
  PRIMARY KEY (`specification_id`,`motion_id`,`party`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `specification` (
  `specification_id` int unsigned NOT NULL AUTO_INCREMENT,
  `judge_id` smallint unsigned NOT NULL,
  `charge_id` smallint unsigned NOT NULL,
  `court_id` smallint unsigned NOT NULL,
  `trial_category` enum('no_trial','jury_trial','bench_trial','any') NOT NULL,
  `total_case_dispositions` int unsigned DEFAULT '0',
  `total_charges` int unsigned DEFAULT '0',
  `total_charges_disposed` int unsigned DEFAULT '0',
  `aquittals` mediumint unsigned DEFAULT '0',
  `dismissals` mediumint unsigned DEFAULT '0',
  `not_responsible` mediumint unsigned DEFAULT '0',
  `nolle_prosequis` mediumint unsigned DEFAULT '0',
  `cwof` mediumint unsigned DEFAULT '0',
  `responsible` mediumint unsigned DEFAULT '0',
  `guilty_plea` mediumint unsigned DEFAULT '0',
  `guilty` mediumint unsigned DEFAULT '0',
  `other` mediumint unsigned DEFAULT '0',
  `fee_count` mediumint unsigned DEFAULT '0',
  `total_fee` mediumint unsigned DEFAULT '0',
  `fee_50` mediumint unsigned DEFAULT '0',
  `fee_100` mediumint unsigned DEFAULT '0',
  `fee_200` mediumint unsigned DEFAULT '0',
  `fee_300` mediumint unsigned DEFAULT '0',
  `fee_500` mediumint unsigned DEFAULT '0',
  `fee_1000` mediumint unsigned DEFAULT '0',
  `fee_2000` smallint unsigned DEFAULT '0',
  `fee_3000` smallint unsigned DEFAULT '0',
  `fee_4000` smallint unsigned DEFAULT '0',
  `fee_5000` smallint unsigned DEFAULT '0',
  `fee_5000_plus` smallint unsigned DEFAULT '0',
  `hoc_count` mediumint unsigned DEFAULT '0',
  `total_hoc_days` int unsigned DEFAULT '0',
  `hoc_1` mediumint unsigned DEFAULT '0',
  `hoc_2` mediumint unsigned DEFAULT '0',
  `hoc_3` mediumint unsigned DEFAULT '0',
  `hoc_4` mediumint unsigned DEFAULT '0',
  `hoc_6` mediumint unsigned DEFAULT '0',
  `hoc_8` mediumint unsigned DEFAULT '0',
  `hoc_10` smallint unsigned DEFAULT '0',
  `hoc_12` smallint unsigned DEFAULT '0',
  `hoc_15` smallint unsigned DEFAULT '0',
  `hoc_18` smallint unsigned DEFAULT '0',
  `hoc_21` smallint unsigned DEFAULT '0',
  `hoc_24` smallint unsigned DEFAULT '0',
  `hoc_24_plus` smallint unsigned DEFAULT '0',
  `probation_count` mediumint unsigned DEFAULT '0',
  `total_probation_days` int unsigned DEFAULT '0',
  `probation_1` mediumint unsigned DEFAULT '0',
  `probation_2` mediumint unsigned DEFAULT '0',
  `probation_3` mediumint unsigned DEFAULT '0',
  `probation_4` mediumint unsigned DEFAULT '0',
  `probation_6` mediumint unsigned DEFAULT '0',
  `probation_8` mediumint unsigned DEFAULT '0',
  `probation_10` smallint unsigned DEFAULT '0',
  `probation_12` smallint unsigned DEFAULT '0',
  `probation_15` smallint unsigned DEFAULT '0',
  `probation_18` smallint unsigned DEFAULT '0',
  `probation_21` smallint unsigned DEFAULT '0',
  `probation_24` smallint unsigned DEFAULT '0',
  `probation_24_plus` smallint unsigned DEFAULT '0',
  `license_lost_count` mediumint unsigned DEFAULT '0',
  `total_license_lost_days` int unsigned DEFAULT '0',
  `license_lost_1` mediumint unsigned DEFAULT '0',
  `license_lost_2` mediumint unsigned DEFAULT '0',
  `license_lost_3` mediumint unsigned DEFAULT '0',
  `license_lost_4` mediumint unsigned DEFAULT '0',
  `license_lost_6` mediumint unsigned DEFAULT '0',
  `license_lost_8` mediumint unsigned DEFAULT '0',
  `license_lost_10` mediumint unsigned DEFAULT '0',
  `license_lost_12` smallint unsigned DEFAULT '0',
  `license_lost_15` smallint unsigned DEFAULT '0',
  `license_lost_18` smallint unsigned DEFAULT '0',
  `license_lost_21` smallint unsigned DEFAULT '0',
  `license_lost_24` smallint unsigned DEFAULT '0',
  `license_lost_24_plus` smallint unsigned DEFAULT '0',
  `total_bail_decisions` int unsigned DEFAULT '0',
  `free_bail` mediumint unsigned DEFAULT '0',
  `cost_bail` mediumint unsigned DEFAULT '0',
  `total_bail_cost` bigint unsigned DEFAULT '0',
  `denied_bail` mediumint unsigned DEFAULT '0',
  `bail_500` mediumint unsigned DEFAULT '0',
  `bail_1000` mediumint unsigned DEFAULT '0',
  `bail_2000` mediumint unsigned DEFAULT '0',
  `bail_3000` mediumint unsigned DEFAULT '0',
  `bail_5000` mediumint unsigned DEFAULT '0',
  `bail_10000` mediumint unsigned DEFAULT '0',
  `bail_15000` smallint unsigned DEFAULT '0',
  `bail_20000` smallint unsigned DEFAULT '0',
  `bail_30000` smallint unsigned DEFAULT '0',
  `bail_40000` smallint unsigned DEFAULT '0',
  `bail_50000` smallint unsigned DEFAULT '0',
  `bail_50000_plus` smallint unsigned DEFAULT '0',
  PRIMARY KEY (`specification_id`,`judge_id`,`charge_id`,`court_id`,`trial_category`),
  UNIQUE KEY `specification_id_UNIQUE` (`specification_id`),
  UNIQUE KEY `specification_keys_UNIQUE` (`judge_id`,`charge_id`,`court_id`,`trial_category`)
) ENGINE=InnoDB AUTO_INCREMENT=1063748 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `users` (
  `id` smallint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

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
