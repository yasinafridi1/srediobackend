import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Manually create __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Create a writable stream for the error log
const errorLogStream = fs.createWriteStream(
  path.join(__dirname, "../error.log"),
  {
    flags: "a",
  }
);

// Custom error logging function
function logError(error) {
  const errorMessage = `[${new Date().toISOString()}] ${
    error.stack || error
  }\n`;
  errorLogStream.write(errorMessage);
}

export default logError;
