import * as cheerio from "cheerio";

/**
 * Parses Airtable revision history HTML into structured data.
 * @param {string} userId - The ID of the user who triggered the scrape.
 * @param {string} issueId - The Airtable record ID (e.g., recl5WpzVYP0lOwaP).
 * @param {object} rowActivityInfoById - Object from Airtable API response.
 * @returns {Array<object>} Parsed revision history entries.
 */
const parseRevisionHistory = (userId, issueId, rowActivityInfoById) => {
  const parsedActivities = [];

  for (const [uuid, activity] of Object.entries(rowActivityInfoById)) {
    const { createdTime, originatingUserId, diffRowHtml } = activity;
    const $ = cheerio.load(diffRowHtml);

    const columnName = $(".historicalCellContainer > .micro").text().trim();

    // Only interested in "Status" and "Assigned Team Members"
    if (columnName !== "Status" && columnName !== "Assigned Team Members") {
      continue;
    }

    let columnType =
      $(".historicalCellValue.diff").attr("data-columntype") || null;

    let oldValue = null;
    let newValue = null;

    if (columnType === "foreignKey") {
      // For foreign keys like "Assigned Team Members"
      const removed = $(".foreignRecord.removed")
        .map((_, el) => $(el).attr("title")?.trim())
        .get();

      const added = $(".foreignRecord.added")
        .map((_, el) => $(el).attr("title")?.trim())
        .get();

      oldValue = removed.length ? removed.join(", ") : null;
      newValue = added.length ? added.join(", ") : null;
      columnType = "Assigned Changed";
    } else if (columnType === "select") {
      // For simple select fields like "Status"
      newValue =
        $(
          ".historicalCellValue.diff span:not([style*='line-through']) .truncate-pre"
        )
          .map((_, el) => $(el).text().trim())
          .get()
          .join(", ") || null;

      oldValue =
        $(".historicalCellValue.diff span[style*='line-through'] .truncate-pre")
          .map((_, el) => $(el).text().trim())
          .get()
          .join(", ") || null;
    }

    parsedActivities.push({
      uuid,
      issueId,
      column: columnName,
      columnType,
      oldValue,
      newValue,
      createdDate: new Date(createdTime),
      authoredBy: originatingUserId,
      userId: userId,
    });
  }

  return parsedActivities;
};

export default parseRevisionHistory;
