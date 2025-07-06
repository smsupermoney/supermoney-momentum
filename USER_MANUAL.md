
# **Nexus CRM: User Acceptance Testing (UAT) Manual**

## **1. Introduction**

### **1.1 Welcome to Nexus CRM**
Welcome to Nexus CRM, a next-generation Customer Relationship Management platform designed from the ground up to streamline your sales and onboarding processes. Through intelligent automation, role-based workflows, and AI-powered insights, Nexus CRM aims to empower you and your team to work more efficiently and close deals faster.

### **1.2 Purpose of This Manual**
This document serves as your guide for User Acceptance Testing (UAT). It is not just a feature list but a hands-on testing script. By following the real-world scenarios outlined for your specific role, you will help us evaluate if Nexus CRM meets the practical demands of your daily work. Your detailed feedback is critical to ensuring we build the best possible tool for Supermoney.

### **1.3 How to Provide Feedback**
As you complete each scenario, please take a moment to thoughtfully answer the questions in the "Testing & Feedback" sections. Note any bugs (e.g., error messages, unexpected behavior), suggest improvements, and highlight anything that felt confusing or inefficient. Please compile all your feedback and send it to **uat-feedback@supermoney.in**.

## **2. Getting Started: First Login**
To begin, please navigate to the Nexus CRM URL provided in your invitation email. Use your assigned credentials to log in. Upon your first login, you should be greeted by a Dashboard tailored specifically to your role, displaying the most relevant metrics for your day-to-day work.

---

## **3. Role-Based Scenarios & Testing**

### **3.1 For the Sales Representative**
*   **A Day in the Life:** Your goal is to manage your assigned leads, move them through the pipeline, and close deals.

*   **Scenario 1: Understanding Your Dashboard & Leads**
    1.  Log in. Your **Dashboard** is the first screen. Notice the cards:
        *   **My Pipeline:** Shows a count of your leads in each stage: `New Leads`, `Contact Made`, `Proposal Sent`, `Negotiating`.
        *   **Recent Activity:** A feed of the latest calls, emails, and meetings logged by you.
        *   **My Tasks for Today:** A list of tasks assigned to you that are due today.
    2.  From the sidebar, click on **Anchors**. This is your main lead list.
    3.  Each anchor is a card. Observe the key information: `Name`, `Industry`, and the current `Status` badge.
    4.  **GenAI Feature:** Look for a badge that says **"Next Best Action"** on some cards. This is an AI-powered suggestion for what you should do next to move that specific deal forward.
    5.  Find a lead with the status 'Lead'. Click anywhere on its card to navigate to the full detail page.
    *   **Testing & Feedback:**
        *   Was your dashboard clear and useful? What other metric would you want to see at a glance?
        *   Is the "Next Best Action" suggestion helpful? Does its placement make sense?
        *   Rate the intuitiveness of finding and opening a lead (1-5, where 5 is very intuitive).

*   **Scenario 2: Working an Anchor Lead & Logging Activity**
    1.  You are now on the **Anchor Profile** page. Notice the tabs at the top: `Details`, `Dealers`, `Vendors`, and `Interactions`.
    2.  On the **Details** tab, review the available information:
        *   **Company Information:** See fields like `GSTIN`, `Credit Rating`, and `Annual Turnover`.
        *   **Key Contacts:** Each contact has a name, designation, email, and phone. You can log an interaction or send an email directly from here.
        *   **GenAI Feature:** Find the **AI Scoring Analysis** card. This shows the AI-generated `Lead Score` (0-100) and a human-readable `Reason` for that score, giving you instant insight into lead quality.
    3.  Imagine you just had a successful call. At the top of the page, find the lead `Status` dropdown (it might say 'Lead'). Click it and change the status to **'Initial Contact'**.
    4.  Now, click the **Interactions** tab.
    5.  In the text box, log the details of your call. For example: *"Initial call was positive. Customer is interested in pricing. They asked for a product brochure."*
    6.  Click the **Log Interaction** button. Your note should appear in the timeline below.
    *   **Testing & Feedback:**
        *   Was the lead's AI score and reason helpful in understanding its potential?
        *   Was updating the lead's status straightforward? Did the available statuses make sense?
        *   Was the process of logging an activity intuitive? How could this be improved?

### **3.2 For the Zonal Sales Manager (ZSM)**
*   **A Day in the Life:** Your goal is to oversee your team's performance, ensure leads are being worked effectively, and unblock your reps.

*   **Scenario 1: Reviewing Team Data & Assigning a New Lead**
    1.  Navigate to the **Admin Panel** from the sidebar. As a manager, this is your hub for lead assignment.
    2.  You will see three tables: **Unassigned Anchors**, **Unassigned Dealers**, and **Unassigned Vendors**.
    3.  Find a lead in the "Unassigned Anchors" table.
    4.  In that lead's row, click the **"Assign To"** dropdown. It should only show the Sales Representatives who report to you.
    5.  Select one of your reps and click the **Assign** button. The lead should disappear from the unassigned list.
    6.  Navigate to the main **Anchors** page. Find the lead you just assigned and confirm it now shows as assigned to that Sales Rep.
    *   **Testing & Feedback:**
        *   Was the process of finding and assigning a lead clear?
        *   Did the CRM provide enough information for you to decide which rep to assign the lead to?
        *   Rate the efficiency of this workflow (1-5, where 5 is very intuitive).

*   **Scenario 2: Preparing for a 1:1 Meeting using AI Reports**
    1.  Go to the **Reports** Module. Notice the AI-powered cards at the top:
        *   **Chat with your Data:** A natural language query box.
        *   **AI-Powered Key Highlights:** An AI-generated summary of your team's performance for the selected period.
    2.  In the **Chat with your Data** box, type: **"Show me a performance summary for [Name of one of your reps] this month."** Click **Ask**.
    3.  The AI will return a structured response, likely including an `insight` and a `query plan`. This confirms the AI understood your request.
    4.  Now, let's use the pre-built reports. Find the **Activity Leaderboard** card. This ranks your team members by the number of activities logged.
    5.  Look at the **Overdue Task Deviations** card. This shows you exactly which reps have overdue tasks, allowing you to offer help.
    *   **Testing & Feedback:**
        *   Did the AI understand your natural language questions accurately?
        *   Were the pre-built cards like the Leaderboard and Overdue Tasks helpful for preparing for your meeting?
        *   How could the reporting make this process even better for you as a manager?

### **3.3 For the Onboarding Specialist**
*   **A Day in the Life:** Your goal is to take newly won deals and guide the customer and their associated spokes (dealers/vendors) through a smooth and complete onboarding process.

*   **Scenario 1: Managing a New Customer Onboarding**
    1.  Navigate to **Onboarding** from the sidebar. This shows a list of anchors with the status 'Onboarding'.
    2.  Click on an anchor to go to its profile page.
    3.  Your primary focus will be on the **Dealers** and **Vendors** tabs. Click the **Vendors** tab.
    4.  You will see a list of all vendors associated with this anchor. Your main job is to update their `Onboarding Status`.
    5.  Find a vendor with the status 'Invited'. Click the dropdown and update their status to **'KYC Pending'**. This simulates that you have contacted them and are now waiting for their documents.
    *   **Testing & Feedback:**
        *   Was the onboarding pipeline view clear? Did it show you the right information?
        *   Was the interface for managing and updating the spoke's (dealer/vendor) status easy to use?
        *   What other statuses or automated tasks would you find helpful for the onboarding process?

### **3.4 For the Admin / National Sales Manager (NSM)**
*   **A Day in the Life:** Your goal is to manage the system, have a high-level strategic view of the entire business, and analyze national trends.

*   **Scenario 1: Creating a New User**
    1.  Navigate to the **Admin Panel** and find the **User Management** card.
    2.  Click **"Add New User"**. A dialog box will appear.
    3.  Fill in the fields: `Name`, `Email`, `Role`, and `Manager`.
    4.  Notice that the list of available `Managers` changes based on the selected `Role`, enforcing the correct hierarchy. Create a new user with the `role` of 'Zonal Sales Manager' and assign them to an existing RSM.
    5.  Save the user. They should now appear in the user list.
    *   **Testing & Feedback:**
        *   Was the user creation form clear and comprehensive? Did the dynamic manager list work correctly?
        *   Were there any permissions or settings you wished you could configure but couldn't?

*   **Scenario 2: High-Level Strategic Reporting with GenAI**
    1.  Go to the **Reports Module**.
    2.  As an Admin/NSM, you have a powerful view. In the **Chat with your Data** box, ask a strategic question: **"Compare the conversion rates between the West and other regions this year."**
    3.  Review the generated chart and insight. The AI interprets your question and builds the correct query against the database.
    4.  Now, look at the **Pipeline Value** card. Use the tabs (`Month`, `Quarter`, `YTD`) to see how the value of deals in your pipeline changes over different time periods.
    5.  Finally, review the **AI-Powered Key Highlights** card. This gives you a concise, machine-generated summary of company performance, pointing out top performers and key trends without you having to ask.
    *   **Testing & Feedback:**
        *   How accurate and insightful were the AI's responses to your strategic questions?
        *   Is the AI-generated summary in "Key Highlights" useful for a quick overview?
        *   What is the #1 report you feel is missing that you would need to run the business?

## **4. Conclusion**
Thank you for your valuable time and expertise in testing Nexus CRM. Your detailed feedback is instrumental in helping us refine the platform and ensure it meets the real-world needs of our team. We appreciate your partnership in making this tool a success and look forward to reviewing your insights.
