import { env } from "../../config/env.js";

export function githubStatus() {
  const credentialsPresent = Boolean(
    env.GITHUB_ENABLED && env.GITHUB_TOKEN && env.GITHUB_REPOSITORY,
  );
  return {
    configured: false,
    credentialsPresent,
    message: credentialsPresent
      ? "GitHub credentials are present, but API operations are not implemented."
      : "GitHub is not connected. No repository requests have been made.",
  };
}
