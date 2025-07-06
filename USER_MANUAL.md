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

*   **Scenario 1: Managing Your Daily Pipeline**
    1.  Log in and navigate to your Dashboard. It should show your Key Metrics (e.g., open leads, deals won this month).
    2.  Go to the "Anchors" (or "My Leads") view. This table should *only* contain leads assigned to you.
    3.  Find a lead with the status 'Lead'. Click on it to view its details.
    *   **Testing & Feedback:**
        *   Was your dashboard clear and useful? What other metric would you want to see?
        *   Was it easy to find and navigate to your list of assigned leads?
        *   Rate the intuitiveness of this process (1-5, where 5 is very intuitive).

*   **Scenario 2: Updating a Lead and Logging Activity**
    1.  From the lead's detail page (from Scenario 1), imagine you just had a successful call.
    2.  Update the lead's `status` from 'Lead' to 'Initial Contact'.
    3.  Navigate to the "Interactions" tab and log a new call. Add the note: "Initial call was positive. Customer is interested in pricing."
    4.  Save the activity. It should appear in the activity timeline.
    *   **Testing & Feedback:**
        *   Was updating the lead's status straightforward?
        *   Was the process of logging a call or email intuitive?
        *   Did you encounter any errors or confusing UI elements? How could this be improved?

### **3.2 For the Zonal Sales Manager (ZSM)**
*   **A Day in the Life:** Your goal is to oversee your team's performance, ensure leads are being worked effectively, and unblock your reps.

*   **Scenario 1: Reviewing Team Performance & Assigning a New Lead**
    1.  Navigate to the "Admin Panel". You should see a list of unassigned leads.
    2.  Find an "Unassigned Lead" of type 'Anchor'.
    3.  Assign this lead to one of the Sales Representatives on your team. The lead should disappear from the unassigned list.
    4.  Navigate to the "Anchors" page and filter/find to confirm the lead now appears assigned to that Sales Rep.
    *   **Testing & Feedback:**
        *   Was the process of finding and assigning a lead clear?
        *   Did the CRM provide enough information for you to decide which rep to assign the lead to?
        *   Rate the efficiency of this workflow (1-5).

*   **Scenario 2: Preparing for a 1:1 Meeting with a Rep**
    1.  Go to the **Reports Module**.
    2.  In the natural language query box, type: **"Show me a performance summary for [Name of one of your reps] this month."**
    3.  Analyze the generated insight and chart (likely showing deals won, activity levels, etc.).
    4.  Now, type: **"Which of [Rep's Name]'s leads are stale or haven't been contacted in 2 weeks?"**
    5.  Use the generated table to form an action plan for your 1:1 meeting.
    *   **Testing & Feedback:**
        *   Did the AI understand your questions accurately?
        *   Was the generated insight helpful for preparing for your meeting?
        *   How could the reporting make this process even better for you?

### **3.3 For the Onboarding Specialist**
*   **A Day in the Life:** Your goal is to take newly won deals and guide the customer through a smooth and complete onboarding process.

*   **Scenario 1: Managing a New Customer Onboarding**
    1.  Navigate to your "Onboarding" view from the sidebar. You should see a list of anchors with the status 'Onboarding'.
    2.  Find a new customer of type 'Vendor' associated with an anchor. Click the anchor to view its details, then navigate to the Vendors tab.
    3.  The onboarding process for a 'Vendor' should include tasks like "Collect KYC Documents" and "Sign Vendor Agreement".
    4.  Update the status of a Vendor from 'Invited' to 'KYC Pending'.
    *   **Testing & Feedback:**
        *   Was the onboarding pipeline view clear?
        *   Was the interface for managing and updating the spoke's (dealer/vendor) status easy to use?
        *   What other automated tasks or checklists would you find helpful?

### **3.4 For the Admin / National Sales Manager (NSM)**
*   **A Day in the Life:** Your goal is to manage the system, have a high-level strategic view of the entire business, and analyze national trends.

*   **Scenario 1: Creating a New User**
    1.  Navigate to the "User Management" section in the Admin Panel.
    2.  Click "Add New User".
    3.  Create a new user with the `role` of 'Zonal Sales Manager'. Assign them to a `manager` (an RSM or yourself) and a `region`.
    4.  Save the user. They should now appear in the user list.
    *   **Testing & Feedback:**
        *   Was the user creation form clear and comprehensive?
        *   Were there any permissions or settings you wished you could configure but couldn't?

*   **Scenario 2: High-Level Strategic Reporting**
    1.  Go to the **Reports Module**.
    2.  Ask the AI a strategic question: **"Compare the conversion rates between the West and other regions this year."**
    3.  Review the generated chart and insight.
    4.  Now ask a forecasting question: **"What is our total projected deal value for next quarter based on the current qualified pipeline?"**
    *   **Testing & Feedback:**
        *   How accurate and insightful were the AI's responses to your strategic questions?
        *   What is the #1 report you feel is missing that you would need to run the business?

## **4. Conclusion**
Thank you for your valuable time and expertise in testing Nexus CRM. Your detailed feedback is instrumental in helping us refine the platform and ensure it meets the real-world needs of our team. We appreciate your partnership in making this tool a success and look forward to reviewing your insights.
