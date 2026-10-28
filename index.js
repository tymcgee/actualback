import "dotenv/config";
import * as api from "@actual-app/api";
import { CronJob } from "cron";
import { format, differenceInHours } from "date-fns";
import { writeFile, mkdir } from "node:fs/promises";

/**
 * Function for getting default values for configs and throwing if they are undefined when they should be.
 * @param {string | undefined} key the environment variable name
 * @param {string} defaultValue the default value if the key is undefined
 * @param {boolean} throwIfUndefined whether to throw if the key is undefined
 * @param {boolean} hideValue whether to hide the value in the log
 */
function env(key, defaultValue, throwIfUndefined = false, hideValue = false) {
  let val = process.env[key];
  if (!val) {
    if (throwIfUndefined) {
      throw new Error(`Environment variable ${key} must be defined`);
    }
    val = defaultValue;
  }
  console.log(`${key} = ${hideValue ? "****" : val}`);
  return val;
}

/**
 * Make a zip backup of the budget and put it into dataDir.
 * @param {string} serverURL the URL of the actual server
 * @param {string} password the password for the actual server
 * @param {string} syncId The sync ID of the budget
 * @param {string} dataDir where the budget gets downloaded
 * @param {string} outputDir where the backup gets saved
 */
async function backupBudget(serverURL, password, syncId, dataDir, outputDir) {
  await mkdir(dataDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });
  const dt = format(new Date(), "yyyy-MM-dd-HH-mm-ss");

  // TODO: is there a way to suppress stdout from the actual api?
  await api.init({ dataDir, serverURL, password });
  // this downloads the budget files into the data dir
  await api.downloadBudget(syncId);
  // make sure we are in sync in case downloadBudget used a local copy
  await api.sync();
  // this creates a zip backup and returns the bytes
  const budgetBytes = await api.exportBudget();
  await writeFile(`${outputDir}/${dt}-bak.zip`, budgetBytes);
  await api.shutdown();
}

// do it
console.log("Parsing config...");
const serverURL = env("ACTUAL_SERVER_URL", null,             true);
const password  = env("ACTUAL_PASSWORD",   null,             true, true);
const syncId    = env("ACTUAL_SYNC_ID",    null,             true);
const dataDir   = env("ACTUAL_DATA_DIR",   "./data/budgets", false);
const outputDir = env("ACTUAL_OUTPUT_DIR", "./data/backups", false);
const cronTime  = env("ACTUAL_CRON_TIME",  "0 0 * * *");
const timeZone  = env("TZ",                "UTC");

// run once on startup just to validate that it'll work...
await backupBudget(serverURL, password, syncId, dataDir, outputDir);

// set up the job!
const job = CronJob.from({ cronTime, timeZone, onTick: () => backupBudget(serverURL, password, syncId, dataDir, outputDir) });
console.log(`Scheduling job to back up data...`);
console.log(`Cron schedule is ${job.cronTime.toString()}`)
console.log(`Next execution is ${job.nextDate()} (which is in ${differenceInHours(job.nextDate(), new Date())} hour(s))`)
job.start();
