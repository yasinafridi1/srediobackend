export const structureRepo = (userId, orgId, repo) => {
  return {
    org: orgId,
    userId,
    private: repo.private,
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url,
    description: repo.description,
    fork: repo.fork,
    url: repo.url,
    forks_url: repo.forks_url,
    keys_url: repo.keys_url,
    collaborators_url: repo.collaborators_url,
    teams_url: repo.teams_url,
    hooks_url: repo.hooks_url,
    issue_events_url: repo.issue_events_url,
    events_url: repo.events_url,
    assignees_url: repo.assignees_url,
    branches_url: repo.branches_url,
    tags_url: repo.tags_url,
    blobs_url: repo.blobs_url,
    git_tags_url: repo.git_tags_url,
    git_refs_url: repo.git_refs_url,
    trees_url: repo.trees_url,
    contributors_url: repo.contributors_url,
    commits_url: repo.commits_url,
    visibility: repo.visibility,
    archived: repo.archived,
    forks: repo.forks,
    open_issues: repo.open_issues,
    watchers: repo.watchers,
    default_branch: repo.default_branch,
    ssh_url: repo.ssh_url,
    clone_url: repo.clone_url,
    svn_url: repo.svn_url,
    git_url: repo.git_url,
    license: repo.license
      ? {
          key: repo.license.key,
          name: repo.license.name,
          url: repo.license.url,
          spdx_id: repo.license.spdx_id,
        }
      : undefined,
    created_at: repo.created_at,
    updated_at: repo.updated_at,
  };
};

export const structureCommits = (userId, repoId, commits) => {
  const structuredData = commits.map((commit) => {
    console.log("Committt", commit.node_id);
    return {
      repo: repoId,
      userId,
      node_id: commit.node_id,
      commit: commit.commit,
      url: commit.url,
      html_url: commit.html_url,
      comments_url: commit.comments_url,
      author: commit.author
        ? {
            login: commit.author.login,
            id: commit.author.id,
            url: commit.author.url,
            site_admin: commit.author.site_admin,
          }
        : null,
      committer: commit.committer
        ? {
            login: commit.committer.login,
            id: commit.committer.id,
            url: commit.committer.url,
            site_admin: commit.committer.site_admin,
          }
        : null,
    };
  });
  return structuredData;
};

export const structurePull = (userId, repoId, pulls) => {
  const structuredData = pulls.map((pull) => {
    return {
      repo: repoId,
      userId,
      id: pull.id,
      url: pull.url,
      state: pull.state,
      title: pull.title,
      body: pull.body,
      locked: pull.locked,
      user: pull.user
        ? {
            login: pull.user.login,
            id: pull.user.id,
            site_admin: pull.user.site_admin,
          }
        : null,
      created_at: pull.created_at,
      updated_at: pull.updated_at,
      closed_at: pull.closed_at,
      merged_at: pull.merged_at,
      assignees:
        pull.assignees?.map((a) => ({
          login: a.login,
          id: a.id,
          site_admin: a.site_admin,
        })) || [],
      requested_reviewers:
        pull.requested_reviewers?.map((r) => ({
          login: r.login,
          id: r.id,
          site_admin: r.site_admin,
        })) || [],
      commits_url: pull.commits_url,
    };
  });

  return structuredData;
};

export const structureIssue = (userId, repoId, issue) => {
  return {
    repo: repoId,
    userId,
    id: issue.id,
    node_id: issue.node_id,
    url: issue.url,
    html_url: issue.html_url,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    locked: issue.locked,
    user: issue.user
      ? {
          login: issue.user.login,
          id: issue.user.id,
          site_admin: issue.user.site_admin,
        }
      : null,
    assignees:
      issue.assignees?.map((a) => ({
        login: a.login,
        id: a.id,
        site_admin: a.site_admin,
      })) || [],
    comments: issue.comments,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    closed_at: issue.closed_at,
    merged_at: issue.merged_at || null, // PRs may not have merged_at
    labels:
      issue.labels?.map((l) => ({
        id: l.id,
        node_id: l.node_id,
        url: l.url,
        name: l.name,
        description: l.description || "",
        color: l.color || "ffffff",
      })) || [],
  };
};

export const structureEvents = (userId, issueId, events) => {
  const structureData = events.map((event) => {
    return {
      issue: issueId,
      userId,
      node_id: event.node_id,
      url: event.url,
      author: event.author
        ? {
            name: event.author.name,
            email: event.author.email,
            date: event.author.date,
          }
        : undefined,
      committer: event.committer
        ? {
            name: event.committer.name,
            email: event.committer.email,
            date: event.committer.date,
          }
        : undefined,
      message: event.message,
      event: event.event,
    };
  });
  return structureData;
};
