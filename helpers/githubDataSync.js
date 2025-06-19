import { Octokit } from "@octokit/rest";
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

var octokit;
var userId;
var startDate;
const endDate = new Date();
var repoDocId;
let issueEventsData = [];

const fetchItemsByDateRange = async (fetchFn, params = {}) => {
  const allItems = [];
  let page = 1;
  const per_page = 100;

  while (true) {
    const { data } = await fetchFn({ ...params, page, per_page });
    if (!data || data.length === 0) break;

    allItems.push(...data);
    if (data.length < per_page) break;
    page++;
  }
  return allItems;
};

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const fetchCommitsByDateRange = async (repo) => {
  const commits = [];
  let currentStart = new Date(startDate);
  const chunkDays = 7;

  while (currentStart < endDate) {
    const since = currentStart.toISOString();
    const untilDate = addDays(currentStart, chunkDays);
    const until =
      untilDate < endDate ? untilDate.toISOString() : endDate.toISOString();

    console.log(`Fetching commits from ${since} to ${until}`);
    const chunkCommits = await fetchItemsByDateRange(
      octokit.rest.repos.listCommits,
      {
        owner: repo.owner.login,
        repo: repo.name,
        since,
        until,
      }
    );
    commits.push(...chunkCommits);
    currentStart = untilDate;
  }
  return commits;
};

const processCommits = async (repo) => {
  const commits = await fetchCommitsByDateRange(repo);
  const commitsToInsertArray = structureCommits(userId, repoDocId, commits);
  await GithubCommit.insertMany(commitsToInsertArray);
};

const processIssueEvents = async (repo, issueNumber, issueId) => {
  console.log(
    `Processing events for issue #${issueNumber} in repo ${repo.name}`
  );
  const issuesEvents = await octokit.paginate(
    "GET /repos/{owner}/{repo}/issues/{issue_number}/events",
    {
      owner: repo.owner.login,
      repo: repo.name,
      issue_number: issueNumber,
      per_page: 100,
      mediaType: {
        previews: ["mockingbird"], // Required for timeline endpoint
      },
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  const eventToInsertedArray = structureEvents(userId, issueId, issuesEvents);
  issueEventsData.push(eventToInsertedArray);
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
  startDate = new Date(repo.created_at);
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
    console.log("Error while syncing data");
    console.log(error);
  }
};
