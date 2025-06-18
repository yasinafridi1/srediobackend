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

const fetchAllPaginated = async (fetchFn, params = {}) => {
  const allData = [];
  let page = 1;
  const per_page = 100;

  while (true) {
    const { data } = await fetchFn({ ...params, page, per_page });
    if (!data || data.length === 0) break;

    allData.push(...data);
    if (data.length < per_page) break;

    page++;
  }

  return allData;
};

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

export const syncFullGithubData = async (
  octokit,
  orgs,
  userId,
  githubDocId
) => {
  for (const org of orgs) {
    const repos = await fetchAllPaginated(octokit.rest.repos.listForOrg, {
      org: org.login,
    });

    for (const repo of repos) {
      console.log("Syncing repo:", repo.name);

      const structureRepoData = structureRepo(userId, org._id, repo);
      const repoDoc = await GithubRepositoryModel.insertOne(structureRepoData);

      let startDate = new Date(repo.created_at);
      const endDate = new Date(); // now
      const chunkDays = 7;

      // --- FETCH COMMITS ---
      const commits = [];
      while (startDate < endDate) {
        const since = startDate.toISOString();
        const untilDate = addDays(startDate, chunkDays);
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

        startDate = untilDate;
      }
      const commitsToInsertArray = structureCommits(
        userId,
        repoDoc._id,
        commits
      );
      await GithubCommit.insertMany(commitsToInsertArray);

      // Reset startDate for pulls and issues chunking
      startDate = new Date(repo.created_at);

      // --- FETCH PULL REQUESTS ---
      const pulls = [];
      while (startDate < endDate) {
        const since = startDate.toISOString();
        const untilDate = addDays(startDate, chunkDays);
        const until =
          untilDate < endDate ? untilDate.toISOString() : endDate.toISOString();

        console.log(`Fetching pulls from ${since} to ${until}`);
        const chunkPulls = await fetchItemsByDateRange(
          octokit.rest.pulls.list,
          {
            owner: repo.owner.login,
            repo: repo.name,
            state: "all",
            sort: "created",
            direction: "asc",
            since, // note: GitHub API for pulls does NOT officially support 'since', so filter manually below
            per_page: 100,
          }
        );

        pulls.push(...chunkPulls);
        startDate = untilDate;
      }

      const pullToInsertArray = structurePull(userId, repoDoc._id, pulls);
      await GithubPullModel.insertMany(pullToInsertArray);

      startDate = new Date(repo.created_at);

      // --- FETCH ISSUES ---
      const issues = [];
      while (startDate < endDate) {
        const since = startDate.toISOString();
        const untilDate = addDays(startDate, chunkDays);
        const until =
          untilDate < endDate ? untilDate.toISOString() : endDate.toISOString();

        console.log(`Fetching issues from ${since} to ${until}`);
        const chunkIssues = await fetchItemsByDateRange(
          octokit.rest.issues.listForRepo,
          {
            owner: repo.owner.login,
            repo: repo.name,
            state: "all",
            since,
            per_page: 100,
          }
        );

        issues.push(...chunkIssues);
        startDate = untilDate;
      }

      for (const issue of issues) {
        if (issue.pull_request) continue; // skip PRs in issues list
        const structureIssueData = structureIssue(userId, repoDoc._id, issue);

        const issueDoc = await GithubIssuesModel.insertOne(structureIssueData);

        const events = await fetchAllPaginated(
          octokit.rest.issues.listEventsForTimeline,
          {
            owner: repo.owner.login,
            repo: repo.name,
            issue_number: issue.number,
            mediaType: { previews: ["mockingbird"] },
          }
        );

        const eventToInsertedArray = structureEvents(
          userId,
          issueDoc._id,
          events
        );
        await GithubIssueEventModel.insertMany(eventToInsertedArray);
      }
    }

    // ORG MEMBERS - no date chunk needed here
    const members = await fetchAllPaginated(octokit.rest.orgs.listMembers, {
      org: org.login,
    });

    for (const member of members) {
      await GithubMemberModel.create({
        org: org._id,
        userId,
        raw: member,
      });
    }

    await GithubIntegration.findByIdAndUpdate(githubDocId, {
      dataSync: "COMPLETED",
    });
  }
};
