/**
 * Receives quiz leads and adds them as rows in a Google Sheet.
 * Setup steps are in quiz/README.md.
 */
const COLUMNS = [
  "date", "firstName", "email", "phone", "province", "wantsCall",
  "result", "second", "age", "ownedHome", "goal", "timeline", "income", "hasCeli",
  "source", "campaign",
];

// Optional: get an email for every new lead. Leave empty to turn it off.
const NOTIFY_EMAIL = "";

function doPost(e) {
  const lead = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
  sheet.appendRow(COLUMNS.map((c) => lead[c] || ""));

  if (NOTIFY_EMAIL) {
    MailApp.sendEmail(
      NOTIFY_EMAIL,
      `New lead: ${lead.firstName} (${lead.result})`,
      COLUMNS.map((c) => `${c}: ${lead[c] || ""}`).join("\n")
    );
  }
  return ContentService.createTextOutput("ok");
}
