```markdown
# System Patterns (systemPatterns.md)

This document outlines the system patterns employed in the LinkedIn Automation and CRM Panel project. It covers the architectural design, data models, API definitions, component structure, integration points, and scalability strategy.

## 1. Architectural Design

The project adopts a layered architecture, promoting separation of concerns and maintainability. The key layers are:

*   **Presentation Layer (Next.js):** This layer is responsible for the user interface, handling user interactions, and displaying data. It uses Next.js with the App Router for routing and component management.
*   **Application Layer (Next.js API Routes):** This layer contains the application logic, orchestrating the interactions between the presentation layer and the domain layer. It handles API requests, validates data, and invokes domain services.
*   **Domain Layer (TypeScript Modules):** This layer encapsulates the core business logic of the application, including LinkedIn automation, data scraping, and data processing. It leverages TypeScript for type safety and modularity.
*   **Data Access Layer (Prisma ORM):** This layer provides an abstraction over the database, allowing the application to interact with the PostgreSQL/SQLite database without being tightly coupled to a specific database technology.
*   **External Integration Layer (Playwright/Puppeteer):** This layer handles the interaction with the LinkedIn platform, using Playwright/Puppeteer for browser automation and data scraping.

This layered architecture promotes testability, maintainability, and scalability. Changes in one layer are less likely to affect other layers.

## 2. Data Models

The core data model centers around the `LinkedInProfile` entity. This entity represents a LinkedIn profile scraped from the platform. Here's a simplified schema:

```typescript
interface LinkedInProfile {
  id: string; // UUID
  firstName: string;
  lastName: string;
  headline: string; // e.g., "CEO at Example Corp"
  location: string;
  profileUrl: string;
  company: string | null;
  jobTitle: string | null;
  connections: number | null;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'connected' | 'ignored'; // Connection request status
  notes: string | null; //Internal notes about the profile
  tags: string[]; // Array of tags associated with profile
}
```

**Database Schema (Prisma example):**

```prisma
model LinkedInProfile {
  id          String   @id @default(uuid())
  firstName   String
  lastName    String
  headline    String
  location    String
  profileUrl  String   @unique
  company     String?
  jobTitle    String?
  connections Int?
  summary     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  status      String   @default("pending")
  notes       String?
  tags      String[]

  @@map("linked_in_profiles")
}
```

This `LinkedInProfile` model is used by Prisma ORM to define the database schema and provide type-safe access to the data.

## 3. API Definitions

The application exposes a RESTful API using Next.js API routes. Key API endpoints include:

*   **`POST /api/profiles/scrape`:**  Initiates a scraping job based on provided search criteria.  Request body: `{ keywords: string, locations: string[], connectionLimit: number }`. Response: `{ jobId: string }`.
*   **`GET /api/profiles`:** Retrieves a list of LinkedIn profiles, with support for pagination, filtering, and sorting.  Request parameters: `page`, `limit`, `filter`, `sort`. Response: `{ profiles: LinkedInProfile[], totalCount: number }`.
*   **`GET /api/profiles/{id}`:** Retrieves a specific LinkedIn profile by its ID. Response: `LinkedInProfile`.
*   **`PUT /api/profiles/{id}`:** Updates a specific LinkedIn profile.  Request body: Partial `LinkedInProfile`. Response: `LinkedInProfile`.
*   **`POST /api/profiles/{id}/connect`:** Sends a connection request to a specific LinkedIn profile. Response: `{ success: boolean }`.
*   **`GET /api/jobs/{jobId}`:** Retrieves the status of a scraping job. Response: `{ status: 'running' | 'completed' | 'failed', progress: number }`.
*   **`GET /api/logs`:** Retrieves the application logs. Request parameters: `page`, `limit`. Response: `{ logs: string[], totalCount: number }`.

These API endpoints are designed to be clear, concise, and easy to use, providing a consistent interface for interacting with the application.

## 4. Component Structure

The Next.js application is structured into reusable components using Shadcn/UI and Tailwind CSS for styling. Key components include:

*   **`Dashboard`:** The main dashboard component, displaying an overview of LinkedIn profiles and scraping jobs.
*   **`ProfileList`:** A component for displaying a list of LinkedIn profiles, with pagination and filtering.
*   **`ProfileCard`:** A component for displaying a single LinkedIn profile.
*   **`ProfileDetails`:** A component for displaying detailed information about a LinkedIn profile.
*   **`ScrapeForm`:** A form component for initiating a new scraping job.
*   **`LogPanel`:** A component for displaying real-time application logs.
*   **`DataTable`:** A reusable component for displaying data in a tabular format, with support for sorting, filtering, and pagination. (Built using Shadcn/UI)
*   **`Dialog`:** A reusable modal component for displaying detailed information or forms. (Built using Shadcn/UI)

This component-based architecture promotes reusability, maintainability, and testability.

## 5. Integration Points

The application integrates with the following external systems:

*   **LinkedIn:** The primary integration point, using Playwright/Puppeteer for browser automation, data scraping, and connection requests.  Rate limiting and robust error handling are crucial for maintaining the integrity of this integration.
*   **PostgreSQL/SQLite Database:** Used for storing scraped profile data and application logs. Prisma ORM provides a type-safe interface for interacting with the database.
*   **Excel Export Library (xlsx/exceljs):** Used for exporting LinkedIn profile data to Excel files.

Careful consideration is given to error handling and retry mechanisms for each integration point to ensure the application's resilience.

## 6. Scalability Strategy

The application's scalability strategy focuses on both horizontal and vertical scaling:

*   **Horizontal Scaling:** The Next.js application can be horizontally scaled by deploying multiple instances behind a load balancer. The database can also be horizontally scaled using techniques such as read replicas and sharding.
*   **Vertical Scaling:** The application can be vertically scaled by increasing the resources (CPU, memory) allocated to each instance.
*   **Database Optimization:** Database performance can be optimized through indexing, query optimization, and caching.
*   **Queueing System:** For long-running tasks such as scraping and sending connection requests, a queueing system (e.g., Redis Queue, RabbitMQ) can be used to decouple the application from these tasks, improving responsiveness and scalability.  The scraping tasks would be enqueued, and worker processes would consume the tasks from the queue.
*   **Caching:** Implement caching mechanisms at various levels (e.g., browser caching, server-side caching using Redis) to reduce database load and improve performance.

This multi-faceted scalability strategy allows the application to handle increasing workloads and maintain performance under heavy load.

Created on 28.11.2025
```