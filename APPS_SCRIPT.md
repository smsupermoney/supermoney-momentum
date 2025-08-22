
# Google Apps Script for Updating CRM Achievements

This script allows you to push achievement data from a Google Sheet directly to your Supermoney Sales Hub CRM.

## Setup Instructions

1.  **Open your Google Sheet:** Navigate to the Google Sheet that contains your team's achievement data.
2.  **Open the Script Editor:** From the menu, go to `Extensions` > `Apps Script`.
3.  **Paste the Code:** Copy the entire code block below and paste it into the script editor, replacing any placeholder code.
4.  **Save the Script:** Click the "Save project" icon (it looks like a floppy disk). Give the project a name when prompted (e.g., "CRM Updater").
5.  **Reload the Sheet:** Go back to your Google Sheet and reload the page. A new menu item named "CRM Actions" should appear.
6.  **Set Script Properties:**
    *   In the script editor, go to `Project Settings` (the gear icon on the left).
    *   Scroll down to the "Script Properties" section.
    *   Click "Add script property".
    *   **Property:** `API_URL`
    *   **Value:** `YOUR_API_ENDPOINT_URL` (Replace this with the full URL of your deployed application's API endpoint, e.g., `https://your-app-name.web.app/api/update-achievements`)
    *   Click "Add script property" again.
    *   **Property:** `API_SECRET`
    *   **Value:** `YOUR_SECRET_TOKEN` (Replace this with the secret token you set in your `.env` file).
7.  **Run for the First Time & Authorize:**
    *   Go back to your Google Sheet.
    *   Click `CRM Actions` > `Update Achievements`.
    *   A dialog box will appear asking for authorization. Click "Continue".
    *   Choose your Google account.
    *   You may see a "Google hasn't verified this app" warning. This is normal for your own scripts. Click "Advanced", then click "Go to [Your Script Name] (unsafe)".
    *   On the next screen, click "Allow" to grant the script permission to access your spreadsheet and send data externally.

## How to Use

1.  **Format Your Sheet:** Ensure your data is in a sheet named **`Achievements`**. The script expects the following columns, starting from `A1`:
    *   `A`: Team (e.g., "South- Ramesh Siva")
    *   `B`: Sanction Limit (Cr)
    *   `C`: AUM (Cr)
2.  **Select the Month:** In the sheet, make sure you have the target month selected. The script will prompt you for the month in `YYYY-MM` format (e.g., `2025-08`).
3.  **Run the Script:** Click `CRM Actions` > `Update Achievements` from the menu. The script will read the data, ask for the month, and send it to your CRM.

---

## The Script Code

```javascript
// /APPS_SCRIPT.md

/**
 * Creates a custom menu in the spreadsheet to trigger the update function.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('CRM Actions')
    .addItem('Update Achievements', 'sendAchievementData')
    .addToUi();
}

/**
 * Main function to read data from the sheet and send it to the API.
 */
function sendAchievementData() {
  const ui = SpreadsheetApp.getUi();
  
  // Prompt for the month
  const monthResponse = ui.prompt('Enter Month', 'Please enter the month for these achievements in YYYY-MM format (e.g., 2025-08):', ui.ButtonSet.OK_CANCEL);
  
  if (monthResponse.getSelectedButton() != ui.Button.OK) {
    ui.alert('Operation cancelled.');
    return;
  }
  
  const month = monthResponse.getResponseText();
  if (!/^\d{4}-\d{2}$/.test(month)) {
    ui.alert('Invalid month format. Please use YYYY-MM.');
    return;
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Achievements');
  if (!sheet) {
    ui.alert('Error: "Achievements" sheet not found.');
    return;
  }

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();

  // Skip the header row
  const headers = values[0];
  const data = values.slice(1);

  const updates = data.map(function(row) {
    // This assumes columns are: Team, Sanction Limit (Cr), AUM (Cr)
    if (row[0] && (row[1] !== '' || row[2] !== '')) {
      return {
        team: row[0],
        sanctionLimit: row[1] || 0,
        aum: row[2] || 0
      };
    }
    return null;
  }).filter(Boolean); // Filter out any empty rows

  if (updates.length === 0) {
    ui.alert('No data found to update.');
    return;
  }

  const payload = {
    month: month,
    updates: updates
  };

  // Get API URL and Secret from Script Properties
  const scriptProperties = PropertiesService.getScriptProperties();
  const apiUrl = scriptProperties.getProperty('API_URL');
  const apiSecret = scriptProperties.getProperty('API_SECRET');

  if (!apiUrl || !apiSecret) {
    ui.alert('Error: API_URL or API_SECRET is not set in Script Properties.');
    return;
  }

  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Bearer ' + apiSecret
    },
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true // Prevent script from stopping on HTTP errors
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();

    if (responseCode === 200) {
      const jsonResponse = JSON.parse(responseBody);
      ui.alert('Success!', jsonResponse.message, ui.ButtonSet.OK);
    } else {
      const errorResponse = JSON.parse(responseBody);
      ui.alert('API Error: ' + responseCode, 'Message: ' + errorResponse.message, ui.ButtonSet.OK);
    }
  } catch (e) {
    ui.alert('Error', 'Failed to send data: ' + e.toString(), ui.ButtonSet.OK);
  }
}
```
