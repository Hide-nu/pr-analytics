interface Repository {
  owner: string;
  repo: string;
}

const REPOSITORY_COOKIE_KEY = "selected-repository";
const COOKIE_EXPIRES_DAYS = 30;

export function saveSelectedRepository(repository: Repository): void {
  if (typeof window === "undefined") return;

  const expires = new Date();
  expires.setDate(expires.getDate() + COOKIE_EXPIRES_DAYS);

  const repositoryString = `${repository.owner}/${repository.repo}`;
  document.cookie = `${REPOSITORY_COOKIE_KEY}=${repositoryString}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function getSelectedRepository(): Repository | null {
  if (typeof window === "undefined") return null;

  const cookies = document.cookie.split(";");
  const repositoryCookie = cookies.find((cookie) =>
    cookie.trim().startsWith(`${REPOSITORY_COOKIE_KEY}=`)
  );

  if (!repositoryCookie) return null;

  const repositoryString = repositoryCookie.split("=")[1];
  const [owner, repo] = repositoryString.split("/");

  if (!owner || !repo) return null;

  return { owner, repo };
}

export function clearSelectedRepository(): void {
  if (typeof window === "undefined") return;

  document.cookie = `${REPOSITORY_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
