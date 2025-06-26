import GithubCommit from "../models/GithubCommitsModel.js";
import GithubIntegration from "../models/GithubIntegrationModel.js";
import GithubIssueEventModel from "../models/GithubIssueEventModel.js";
import GithubIssuesModel from "../models/GithubIssuesModel.js";
import GithubMemberModel from "../models/GithubMemberModel.js";
import GithubPullModel from "../models/GithubPullModel.js";
import GithubRepositoryModel from "../models/GithubRepositoryModel.js";
import {
  structureCommits,
  structureEvents,
  structureIssue,
  structurePull,
  structureRepo,
} from "./StructureGithubData.js";
import sendGithubSyncNotification, {
  sendGithubSyncFailureNotification,
} from "./NotificationService.js";

var octokit;
var userId;
var repoDocId;
let issueEventsData = [];

const fetchWithRetry = async (fn, retries = 3, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRetriable =
        error.code === "ECONNRESET" ||
        error.status === 503 ||
        error.message.includes("Connection refused");

      if (isRetriable && attempt < retries) {
        console.warn(
          `Request failed (${
            error.code || error.status
          }). Retrying in ${delay}ms... (Attempt ${attempt}/${retries})`
        );
        await new Promise((r) => setTimeout(r, delay * attempt));
      } else {
        console.error(
          `Request failed after ${attempt} attempt(s): ${error.message}`
        );
      }
    }
  }
};

const paginateCommits = async (repo) => {
  const commits = [];
  const chunkCommits = await octokit.paginate(
    "GET /repos/{owner}/{repo}/commits",
    {
      owner: repo.owner.login,
      repo: repo.name,
      per_page: 100,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
  commits.push(...chunkCommits);
  return commits;
};

const processCommits = async (repo) => {
  const commits = await paginateCommits(repo);
  const commitsToInsertArray = structureCommits(userId, repoDocId, commits);
  await GithubCommit.insertMany(commitsToInsertArray);
};

const processIssueEvents = async (repo, issueNumber, issueId) => {
  console.log(
    `Processing events for issue #${issueNumber} in repo ${repo.name}`
  );

  const issuesEvents = await fetchWithRetry(() =>
    octokit.paginate("GET /repos/{owner}/{repo}/issues/{issue_number}/events", {
      owner: repo.owner.login,
      repo: repo.name,
      issue_number: issueNumber,
      per_page: 100,
      mediaType: {
        previews: ["mockingbird"],
      },
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })
  );

  if (issuesEvents.length) {
    const eventToInsertedArray = structureEvents(userId, issueId, issuesEvents);
    issueEventsData.push(...eventToInsertedArray);
  }
};

const processPullRequests = async (repo) => {
  const pulls = await octokit.paginate("GET /repos/{owner}/{repo}/pulls", {
    owner: repo.owner.login,
    repo: repo.name,
    state: "all",
    per_page: 100,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const pullToInsertArray = structurePull(userId, repoDocId, pulls);
  await GithubPullModel.insertMany(pullToInsertArray);
};

const processIssues = async (repo) => {
  const issues = await octokit.paginate("GET /repos/{owner}/{repo}/issues", {
    owner: repo.owner.login,
    repo: repo.name,
    state: "all",
    per_page: 100,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const structureIssueData = structureIssue(userId, repoDocId, issues);
  const issueDoc = await GithubIssuesModel.insertMany(structureIssueData);
  for (const issue of issueDoc) {
    if (!issue.rawData.pull_request) {
      await processIssueEvents(repo, issue.rawData.number, issue._id);
    }
  }

  await GithubIssueEventModel.insertMany(issueEventsData);
};

const processRepository = async (repo, orgId) => {
  const structureRepoData = structureRepo(userId, orgId, repo);
  const repoDoc = await GithubRepositoryModel.insertOne(structureRepoData);
  repoDocId = repoDoc._id;
  await processCommits(repo);
  await processPullRequests(repo);
  await processIssues(repo);
};

const processOrganizationMembers = async (org) => {
  const members = await octokit.paginate("GET /orgs/{org}/members", {
    org: org.login,
    per_page: 100,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  for (const member of members) {
    await GithubMemberModel.create({
      org: org._id,
      userId,
      rawData: member,
    });
  }
};

const markSyncComplete = async (githubDocId) => {
  await GithubIntegration.findByIdAndUpdate(githubDocId, {
    dataSync: "COMPLETED",
  });

  await sendGithubSyncNotification(userId);
};

export const syncFullGithubData = async (
  octoKit,
  orgs,
  user_id,
  githubDocId
) => {
  octokit = octoKit;
  userId = user_id;
  try {
    for (const org of orgs) {
      const repos = await octokit.paginate("GET /orgs/{org}/repos", {
        org: org.rawData.login,
        type: "all",
        per_page: 100,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      for (const repo of repos) {
        await processRepository(repo, org._id);
      }

      await processOrganizationMembers(org.rawData);
      await markSyncComplete(githubDocId);
    }
  } catch (error) {
    await sendGithubSyncFailureNotification(userId);
    console.log("Error while syncing data");
    console.log(error);
  }
};
