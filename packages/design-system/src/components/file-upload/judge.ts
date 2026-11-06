import type { FileUploadLimits } from "./limits";

/** What `judgeFiles` reads of a file; a browser `File` fits. */
export interface FileLike {
  name: string;
  size: number;
  type: string;
}

export type RejectReason = "type" | "size" | "count";

export interface RejectedFile {
  name: string;
  size: number;
  reason: RejectReason;
}

const typeAllowed = (file: FileLike, limits: FileUploadLimits) => {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return limits.types.some(
    (rule) =>
      type === rule.mime ||
      (type === "" && rule.extensions.some((extension) => name.endsWith(extension))),
  );
};

/**
 * The check before the wait (`upload-judge-1`): a courtesy that saves a person a wait, not a
 * security control. `file.type` is what the browser reports and a person can pass it, so the real
 * checks (magic bytes, size, count) stay on the server (`upload-server-1`). Files are walked in the
 * order given and each gets one result: refused for `type`, else for `size`, else for `count` once
 * `used` plus the files accepted so far has reached `limits.maxFiles`, else accepted. A refused
 * file takes no slot. A pick and a drop run this same function.
 */
export function judgeFiles<F extends FileLike>(
  files: readonly F[],
  limits: FileUploadLimits,
  used: number,
): { accepted: F[]; rejected: RejectedFile[] } {
  const accepted: F[] = [];
  const rejected: RejectedFile[] = [];
  for (const file of files) {
    const refuse = (reason: RejectReason) =>
      rejected.push({ name: file.name, size: file.size, reason });
    if (!typeAllowed(file, limits)) refuse("type");
    else if (file.size > limits.maxBytes) refuse("size");
    else if (used + accepted.length >= limits.maxFiles) refuse("count");
    else accepted.push(file);
  }
  return { accepted, rejected };
}
