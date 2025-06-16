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
  } = data;

  return {
    githubId,
    githubUsername,
    githubFullName,
    public_repos,
    followers,
    following,
    private_repos,
    connectedAt,
    organizations: orgs?.length || 0,
  };
};

export const userDto = (user) => {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    github: user.github ? githubUserDto(user.github) : null,
  };
};
