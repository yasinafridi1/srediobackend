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
