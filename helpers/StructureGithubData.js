import mongoose from "mongoose";

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

export const flattenData = (obj, prefix = "") => {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    const prefixedKey = prefix ? `${prefix}_${key}` : key;

    if (value instanceof mongoose.Types.ObjectId) {
      acc[prefixedKey] = value.toString();
    } else if (Array.isArray(value)) {
      // Handle array of primitives or objects
      if (value.every((v) => typeof v !== "object" || v === null)) {
        acc[prefixedKey] = value.join(", ");
      } else {
        value.forEach((el, idx) => {
          const nested = flattenData(el, `${prefixedKey}[${idx}]`);
          Object.assign(acc, nested);
        });
      }
    } else if (typeof value === "object" && value !== null) {
      Object.assign(acc, flattenData(value, prefixedKey));
    } else {
      acc[prefixedKey] = value;
    }

    return acc;
  }, {});
};
