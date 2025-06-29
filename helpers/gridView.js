import AirTableRevisionModel from "../models/AirTableRevisionModel.js";
import parseRevisionHistory from "./parseRevisionHistory.js";

const loadGridView = async (page, pageUrl, userId) => {
  let dataToBeInserted = [];
  await page.goto(pageUrl, { waitUntil: "networkidle2" });
  await page.waitForSelector(".expandRowCell", { timeout: 90000 });

  const expandHandles = await page.$$(".expandRowCell");

  for (let i = 0; i < expandHandles.length; i++) {
    const handle = expandHandles[i];
    const recordId = await handle.evaluate((el) => {
      const href = el.getAttribute("href");
      const parts = href?.split("/") || [];
      return parts[parts.length - 1]?.split("?")[0] || null;
    });
    // Scroll into view
    await handle.evaluate((el) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    );

    let apiCalled = false;
    let responseData = null;

    const responseListener = async (res) => {
      const url = res.url();
      if (
        url.includes("/readRowActivitiesAndComments") &&
        res.status() === 200
      ) {
        apiCalled = true;
        responseData = await res.json();
      }
    };

    page.on("response", responseListener);

    // Click expand handle
    await handle.click();

    // Wait for activity menu to appear
    try {
      await page.waitForSelector('[aria-label="Open activity feed menu"]', {
        timeout: 10000,
      });

      // Check selected tab (usually "Comments" by default)
      const selectedActivityLabel = await page.$eval(
        '[aria-label="Open activity feed menu"] p',
        (el) => el.textContent.trim()
      );

      if (selectedActivityLabel !== "Revision history") {
        await page.click('[aria-label="Open activity feed menu"]');

        // Click "Revision history" in dropdown
        await page.evaluate(() => {
          const items = Array.from(
            document.querySelectorAll('[role="menuitemcheckbox"]')
          );
          const revisionItem = items.find((el) =>
            el.textContent.includes("Revision history")
          );
          revisionItem?.click();
        });
      }

      // Wait for API response
      await page.waitForResponse(
        (res) =>
          res.url().includes("/readRowActivitiesAndComments") &&
          res.status() === 200,
        { timeout: 10000 }
      );
    } catch (e) {
      console.log(`⚠️ Row ${i + 1} - Activity feed may have failed to open.`);
    }

    // Small delay
    await new Promise((r) => setTimeout(r, 1000));
    page.off("response", responseListener);

    // Log result
    if (apiCalled && responseData) {
      if (responseData?.data?.rowActivityInfoById) {
        const revisionRecords = parseRevisionHistory(
          userId,
          recordId,
          responseData?.data?.rowActivityInfoById
        );
        dataToBeInserted.push(...revisionRecords);
      }
    } else {
      console.log(
        `❌ [${i + 1}/${expandHandles.length}] No revision history detected`
      );
    }

    // Try to close the modal
    try {
      await page.waitForSelector('[aria-label="Close dialog"]', {
        timeout: 10000,
      });
      await page.click('[aria-label="Close dialog"]');
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.log(`⚠️ Could not close modal for row ${i + 1}`);
    }
  }
  await AirTableRevisionModel.insertMany(dataToBeInserted);
  console.log("✅ All rows processed.");
};

export default loadGridView;
