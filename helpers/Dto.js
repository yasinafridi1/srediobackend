import { formatDateTime } from "./DateTimeFormatter.js";

const githubUserDto = (data) => {
  const {
    githubId,
    githubUsername,
    githubFullName,
    public_repos,
    followers,
    following,
    private_repos,
    connectedAt,
    orgs,
    dataSync,
  } = data;

  return {
    githubId,
    githubUsername,
    githubFullName,
    public_repos,
    followers,
    following,
    private_repos,
    connectedAt: formatDateTime(connectedAt),
    organizations: orgs?.length || 0,
    dataSync,
  };
};

export const userDto = (user) => {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    airTable: user?.airTable
      ? {
          dataSync: user.airTable.dataSync,
          dataScrap: user.airTable.dataScrap,
          createdAt: formatDateTime(user.airTable.createdAt),
        }
      : null,
  };
};

export const revisionDTO = (data) => {
  return {
    uuid: data?.uuid,
    issueId: data?.issueId,
    column: data?.column,
    columnType: data?.columnType,
    oldValue: data?.oldValue,
    newValue: data?.newValue,
    createdDate: data?.createdDate ? formatDateTime(data?.createdDate) : null,
    authoredBy: data?.authoredBy,
  };
};
