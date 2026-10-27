import { baseURL } from "$lib/helpers";
import { authFetch, SESSION_EXPIRED_MESSAGE } from "./authFetch";

export const LETTER_FORBIDDEN_MESSAGE =
  "You are not allowed to print this document";
export const LETTER_NOT_FOUND_MESSAGE =
  "No document could be generated for this application";
export const LETTER_GENERIC_MESSAGE =
  "Could not generate the document, please try again";
export const LETTER_POPUP_BLOCKED_MESSAGE =
  "The document tab was blocked. Allow pop-ups and try again.";

export type LetterParams = Record<string, string | number | null | undefined>;

/**
 * Opens a generated letter/receipt in a new tab.
 *
 * `/api/letters/generate` is a protected endpoint, so navigating to it with
 * `window.open` never carries the bearer token and the request fails before the
 * letter is produced. The PDF is fetched with the session token instead and the
 * resulting blob is handed to the tab.
 *
 * Throws an `Error` whose message is safe to show to the user.
 */
export async function openLetter(params: LetterParams): Promise<void> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    query.set(key, String(value));
  }

  // Opened before awaiting so the browser still treats it as user-initiated.
  const tab = window.open("about:blank", "_blank");
  if (!tab) throw new Error(LETTER_POPUP_BLOCKED_MESSAGE);

  let objectUrl: string | null = null;
  try {
    const response = await authFetch(
      `${baseURL}/api/letters/generate?${query}`,
      {
        method: "GET",
        headers: { Accept: "application/pdf" },
      },
    );

    if (!response.ok) {
      if (response.status === 401) throw new Error(SESSION_EXPIRED_MESSAGE);
      if (response.status === 403) throw new Error(LETTER_FORBIDDEN_MESSAGE);
      if (response.status === 404) throw new Error(LETTER_NOT_FOUND_MESSAGE);
      throw new Error(LETTER_GENERIC_MESSAGE);
    }

    const blob = await response.blob();
    if (blob.size === 0) throw new Error(LETTER_GENERIC_MESSAGE);

    objectUrl = URL.createObjectURL(
      new Blob([blob], { type: "application/pdf" }),
    );
    const urlToRevoke = objectUrl;
    window.setTimeout(() => URL.revokeObjectURL(urlToRevoke), 5 * 60_000);
    tab.location.replace(objectUrl);
  } catch (error) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    tab.close();
    throw error;
  }
}
