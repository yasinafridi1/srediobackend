export const structureRepo = (userId, orgId, repo) => {
  console.log("Processing Repo for org:", orgId);
  return {
    org: orgId,
    userId,
    rawData: repo,
  };
};

export const structureCommits = (userId, repoId, commits) => {
  console.log("Processing Commits for repo:", repoId);
  const structuredData = commits.map((commit) => {
    return {
      repo: repoId,
      userId,
      rawData: commit,
    };
  });
  return structuredData;
};

export const structurePull = (userId, repoId, pulls) => {
  const structuredData = pulls.map((pull) => {
    return {
      repo: repoId,
      userId,
      rawData: {
        ...pull,
        head: {
          label: pull.head.label,
          ref: pull.head.ref,
          sha: pull.head.sha,
        },
        base: {
          label: pull.base.label,
          ref: pull.base.ref,
          sha: pull.base.sha,
        },
      },
    };
  });

  return structuredData;
};

export const structureIssue = (userId, repoId, issues) => {
  const structureData = [];
  issues.forEach((issue) => {
    if (!issue.pull_request) {
      structureData.push({
        repo: repoId,
        userId,
        rawData: issue,
      });
    }
  });
  return structureData;
};

export const structureEvents = (userId, issueId, events) => {
  const structureData = events.map((event) => {
    return {
      issue: issueId,
      userId,
      rawData: event,
    };
  });
  return structureData;
};
