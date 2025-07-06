# Supermoney Sales Hub - Product Note

This document provides a comprehensive overview of the Supermoney Sales Hub CRM, including its features, user roles, current capabilities, and a roadmap for future development.

## I. Core Features

The CRM is designed to streamline the sales and onboarding process for supply chain finance products.

-   **Lead Management:**
    -   Create, view, and manage three types of leads: Anchors (large corporate clients), Dealers, and Vendors (Spokes).
    -   Dedicated pages for each lead type with responsive list and card views for easy access.
    -   Bulk upload functionality for adding multiple Dealer or Vendor leads at once from a CSV file.

-   **AI-Powered Lead Scoring:**
    -   **Anchor Scoring:** New Anchor leads are automatically analyzed by an AI model to generate a score (0-100) based on factors like industry, company name, and location, helping prioritize high-potential leads.
    -   **Spoke Scoring:** New Dealer and Vendor leads are also scored by AI, considering their details and their association with an Anchor company.
    -   AI provides a concise, human-readable reason for each score, giving sales users immediate insight.

-   **User & Role Management:**
    -   A robust, role-based access control (RBAC) system is in place.
    -   An Admin Panel allows for the creation of new users and the assignment of roles and reporting managers.

-   **Task Management & Activity Logging:**
    -   Create and assign tasks (Calls, Emails, Meetings) related to a specific Anchor.
    -   Track tasks by due date, priority, and status.
    -   Log the outcome of completed tasks, which automatically creates an entry in the interaction log.
    -   Manually log any interaction (a call, an in-person meeting) on an Anchor's profile.
    -   Simulated email sending functionality that logs the interaction to the respective entity's activity feed.

-   **Role-Based Dashboards & Reporting:**
    -   **Dashboards:** Each user role gets a tailored dashboard showing the most relevant information at a glance (e.g., a Sales person sees their personal pipeline, while a ZSM sees their team's pipeline).
    -   **Reports:** A dynamic reporting page provides analytics based on the user's role, including pipeline funnels, activity leaderboards, and stage conversion rates.

## II. User Roles & Permissions

The CRM supports four distinct user roles, each with specific permissions.

-   **Admin:**
    -   Has complete, unrestricted access to all data and features.
    -   Manages users and can assign any unassigned lead.
    -   Views global, company-wide dashboards and reports.

-   **Zonal Sales Manager (ZSM):**
    -   Can view and manage data for themselves and all Sales users who report to them.
    -   Can assign unassigned leads to their direct reports.
    -   Sees a team-focused dashboard and performance reports.

-   **Sales:**
    -   Can only view and manage leads and tasks that are directly assigned to them.
    -   Has a personalized dashboard and report focusing on their individual performance.

-   **Onboarding Specialist:**
    -   A specialized role focused on guiding Anchors through the "Onboarding" stage.
    -   Can update the onboarding status of an Anchor's associated Dealers and Vendors.
    -   Has a simplified UI focused purely on the onboarding pipeline.

## III. Current Capabilities

-   **Technology Stack:** The application is built with Next.js, React, Tailwind CSS, and ShadCN UI components. AI features are powered by Google's Gemini model via Genkit.
-   **Data Persistence:** The application is fully integrated with **Firebase Firestore**, serving as the live backend database. All data created or modified in the app is persistent.
-   **User Authentication:** User login is currently **simulated**. A static list of users is available, and all use the password `test123`.
-   **Email & File I/O:** Emailing and CSV file uploads are **simulated**. The UI and front-end logic exist, but they are not yet connected to a real email service or file storage backend.

## IV. Future Capabilities & Production Roadmap

The following are key areas to address to make the application production-ready.

1.  **Full User Authentication:**
    -   **Action:** Integrate **Firebase Authentication** for secure user sign-up, sign-in, password resets, and session management.

2.  **Real-time Notifications:**
    -   **Action:** Implement an in-app notification system (e.g., using Firestore listeners) to alert users about new lead assignments, task reminders, and mentions.

3.  **Full Email Integration:**
    -   **Action:** Connect the "Compose Email" dialog to a real email-sending service (e.g., SendGrid, Mailgun) using a secure backend function (like a Firebase Cloud Function).

4.  **Real File Storage for Bulk Upload:**
    -   **Action:** Integrate **Firebase Storage** to handle the actual upload of CSV files, which can then be processed securely on the backend.

5.  **Advanced Reporting & Analytics:**
    -   **Action:** Replace placeholder metrics (like "Lead Velocity") with real calculations from the database. Add features like date-range filtering and the ability to export reports to CSV.

6.  **Global Search:**
    -   **Action:** Implement a global search bar to allow users to quickly find any anchor, dealer, vendor, or contact across the entire system.

7.  **Testing and Deployment:**
    -   **Action:** Develop a suite of unit and integration tests. Set up a CI/CD pipeline for automated, reliable deployments to a hosting environment.
