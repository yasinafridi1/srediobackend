import AirTableRevisionModel from "../models/AirTableRevisionModel.js";
import parseRevisionHistory from "./parseRevisionHistory.js";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const loadGridView = async (page, pageUrl, userId) => {
  let dataToBeInserted = [];

  await page.goto(pageUrl, { waitUntil: "networkidle2" });
  await page.waitForSelector(".expandRowCell", { timeout: 90000 });

  const expandHandles = await page.$$(".expandRowCell");

  console.log(`🔄 Found ${expandHandles.length} records.`);

  for (let i = 0; i < expandHandles.length; i++) {
    const handle = expandHandles[i];
    const recordId = await handle.evaluate((el) => {
      const href = el.getAttribute("href");
      const parts = href?.split("/") || [];
      return parts[parts.length - 1]?.split("?")[0] || null;
    });

    await handle.evaluate((el) =>
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    );

    // Wait for API call
    let apiResponsePromise;
    let responseData = null;

    const responseListener = async (res) => {
      if (
        res.url().includes("/readRowActivitiesAndComments") &&
        res.status() === 200
      ) {
        try {
          responseData = await res.json();
        } catch {}
      }
    };

    page.on("response", responseListener);

    // Open the row modal
    await handle.click();

    try {
      await page.waitForSelector('[aria-label="Open activity feed menu"]', {
        timeout: 10000,
      });

      const selectedTab = await page.$eval(
        '[aria-label="Open activity feed menu"] p',
        (el) => el.textContent.trim()
      );

      if (selectedTab !== "Revision history") {
        await page.click('[aria-label="Open activity feed menu"]');

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

      // Wait up to 5s for response or skip
      await Promise.race([
        page.waitForResponse(
          (res) =>
            res.url().includes("/readRowActivitiesAndComments") &&
            res.status() === 200,
          { timeout: 5000 }
        ),
        wait(1000), // fallback timeout if not triggered
      ]);
    } catch (e) {
      console.log(`⚠️ Row ${i + 1} - Activity feed or revision menu failed.`);
    }

    page.off("response", responseListener);

    // Parse and store data
    if (responseData?.data?.rowActivityInfoById) {
      const revisionRecords = parseRevisionHistory(
        userId,
        recordId,
        responseData.data.rowActivityInfoById
      );
      dataToBeInserted.push(...revisionRecords);

      console.log(
        `✅ [${i + 1}/${expandHandles.length}] Parsed ${
          revisionRecords.length
        } revisions`
      );
    } else {
      console.log(
        `❌ [${i + 1}/${expandHandles.length}] No revision history found`
      );
    }

    // Close modal
    try {
      await page.waitForSelector('[aria-label="Close dialog"]', {
        timeout: 10000,
      });
      await page.click('[aria-label="Close dialog"]');
      await wait(500);
    } catch {
      console.log(`⚠️ Could not close modal for row ${i + 1}`);
    }
  }

  if (dataToBeInserted.length) {
    await AirTableRevisionModel.insertMany(dataToBeInserted);
    console.log(`✅ Inserted ${dataToBeInserted.length} revision records`);
  } else {
    console.log("ℹ️ No revision records to insert");
  }

  console.log("✅ All rows processed.");
};

export default loadGridView;
