```markdown
## Technology Context (techContext.md)

This document outlines the technology stack, development tools, environments, testing strategy, deployment process, and continuous integration approach used in the LinkedIn Automation and CRM Panel project.

## Technologies Used

*   **Frontend:**
    *   Next.js (with App Router): A React framework for building performant and scalable web applications. The App Router enables server components and routing.
    *   TypeScript: A superset of JavaScript that adds static typing, improving code maintainability and reducing errors.
    *   Tailwind CSS: A utility-first CSS framework for rapidly styling the frontend.
    *   Shadcn/UI: A collection of accessible and reusable UI components built with Radix UI and Tailwind CSS.
*   **Backend:**
    *   Node.js: A JavaScript runtime environment for executing server-side code.
    *   Prisma ORM: A next-generation ORM for Node.js and TypeScript that simplifies database interactions.
    *   PostgreSQL/SQLite: Database options for storing scraped LinkedIn profile data. PostgreSQL is preferred for production due to its scalability and reliability, while SQLite can be used for local development and testing.
*   **Automation & Scraping:**
    *   Playwright/Puppeteer: Node.js libraries for automating browser interactions, used for sending connection requests and scraping profile information.
*   **Data Handling:**
    *   xlsx/exceljs: Libraries for exporting data to Excel files.

## Software Development Tools

*   **IDE:** Visual Studio Code (VS Code) with relevant extensions (e.g., ESLint, Prettier, TypeScript).
*   **Version Control:** Git with GitHub/GitLab/Bitbucket for code repository management.
*   **Package Manager:** npm or yarn for managing project dependencies.
*   **Database Management:** Dbeaver or pgAdmin for managing PostgreSQL databases. SQLiteStudio for managing SQLite databases.
*   **API Testing:** Postman or Insomnia for testing API endpoints (if any).
*   **Debugging:** Browser developer tools (Chrome DevTools, Firefox Developer Tools) and VS Code debugger.
*   **Linter/Formatter:** ESLint and Prettier for code linting and formatting.

## Development Environment

*   **Operating System:** macOS, Windows, or Linux (developers' choice).
*   **Node.js Version:** [Specify Node.js version, e.g., v18.x or v20.x] - Consistent version across all development environments is crucial. Managed with nvm (Node Version Manager).
*   **Database:** Local PostgreSQL or SQLite instance for development. Docker can be used to containerize PostgreSQL for consistent environment setup.
*   **Environment Variables:** Configuration managed through `.env` files for sensitive information and environment-specific settings.

## Testing Strategy

*   **Unit Tests:** Testing individual components and functions in isolation using Jest or Vitest. Focus on testing business logic and critical functionalities.
*   **Integration Tests:** Testing the interaction between different modules and services, including database interactions.
*   **End-to-End (E2E) Tests:** Using Playwright/Puppeteer to simulate user interactions and verify the application's functionality from end to end. These tests will validate critical workflows like login, connection request sending, and data scraping.
*   **Manual Testing:** Manual testing by QA engineers to verify the user interface, usability, and edge cases.
*   **Rate Limiting Tests:** Specific tests to ensure the rate limiting mechanism is working correctly and preventing account restrictions.
*   **Database Tests:** Tests to ensure data integrity, consistency, and proper database interactions.

## Deployment Process

*   **Platform:** [Specify deployment platform, e.g., Vercel, Netlify, AWS, Digital Ocean]
*   **Process:**
    1.  Code is pushed to the main branch in the Git repository.
    2.  The CI/CD pipeline is triggered (see Continuous Integration Approach).
    3.  The application is built and tested.
    4.  The application is deployed to the specified platform.
    5.  Environment variables are configured on the deployment platform.
    6.  Database migrations are run (if necessary).
    7.  The application is monitored after deployment.
*   **Database Migration:** Prisma Migrate will be used to manage database schema changes.

## Continuous Integration Approach

*   **CI/CD Tool:** [Specify CI/CD tool, e.g., GitHub Actions, GitLab CI, Jenkins]
*   **Workflow:**
    1.  On every push to the main branch or pull request, the CI/CD pipeline is triggered.
    2.  The pipeline performs the following steps:
        *   Linting and formatting using ESLint and Prettier.
        *   Running unit tests, integration tests, and end-to-end tests.
        *   Building the application.
        *   Deploying the application to a staging environment for manual testing.
    3.  If all tests pass and manual testing is successful, the application is deployed to the production environment.
    4.  Notifications are sent to the development team upon completion of each stage.

Created on 28.11.2025
```