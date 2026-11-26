export interface PromptDiffLine {
  kind: "unchanged" | "added" | "removed" | "modified";
  before?: string;
  after?: string;
}

export const comparePromptContent = (
  before: string,
  after: string,
): PromptDiffLine[] => {
  const oldLines = before.split("\n");
  const newLines = after.split("\n");
  let prefix = 0;
  while (
    prefix < oldLines.length &&
    prefix < newLines.length &&
    oldLines[prefix] === newLines[prefix]
  ) {
    prefix += 1;
  }

  let suffix = 0;
  while (
    suffix < oldLines.length - prefix &&
    suffix < newLines.length - prefix &&
    oldLines[oldLines.length - 1 - suffix] ===
      newLines[newLines.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const result: PromptDiffLine[] = oldLines
    .slice(0, prefix)
    .map((line) => ({ kind: "unchanged", before: line, after: line }));
  const oldMiddle = oldLines.slice(prefix, oldLines.length - suffix);
  const newMiddle = newLines.slice(prefix, newLines.length - suffix);
  const operations: PromptDiffLine[] = [];
  if (oldMiddle.length * newMiddle.length <= 100_000) {
    const table = Array.from(
      { length: oldMiddle.length + 1 },
      () => new Uint32Array(newMiddle.length + 1),
    );
    for (let oldIndex = oldMiddle.length - 1; oldIndex >= 0; oldIndex -= 1) {
      for (let newIndex = newMiddle.length - 1; newIndex >= 0; newIndex -= 1) {
        table[oldIndex][newIndex] =
          oldMiddle[oldIndex] === newMiddle[newIndex]
            ? table[oldIndex + 1][newIndex + 1] + 1
            : Math.max(
                table[oldIndex + 1][newIndex],
                table[oldIndex][newIndex + 1],
              );
      }
    }
    let oldIndex = 0;
    let newIndex = 0;
    while (oldIndex < oldMiddle.length || newIndex < newMiddle.length) {
      if (
        oldIndex < oldMiddle.length &&
        newIndex < newMiddle.length &&
        oldMiddle[oldIndex] === newMiddle[newIndex]
      ) {
        operations.push({
          kind: "unchanged",
          before: oldMiddle[oldIndex],
          after: newMiddle[newIndex],
        });
        oldIndex += 1;
        newIndex += 1;
      } else if (
        oldIndex < oldMiddle.length &&
        (newIndex >= newMiddle.length ||
          table[oldIndex + 1][newIndex] >= table[oldIndex][newIndex + 1])
      ) {
        operations.push({ kind: "removed", before: oldMiddle[oldIndex] });
        oldIndex += 1;
      } else {
        operations.push({ kind: "added", after: newMiddle[newIndex] });
        newIndex += 1;
      }
    }
  } else {
    const paired = Math.min(oldMiddle.length, newMiddle.length);
    for (let index = 0; index < paired; index += 1) {
      operations.push({
        kind: oldMiddle[index] === newMiddle[index] ? "unchanged" : "modified",
        before: oldMiddle[index],
        after: newMiddle[index],
      });
    }
    oldMiddle.slice(paired).forEach((line) =>
      operations.push({ kind: "removed", before: line }),
    );
    newMiddle.slice(paired).forEach((line) =>
      operations.push({ kind: "added", after: line }),
    );
  }

  for (let index = 0; index < operations.length; ) {
    if (operations[index].kind === "unchanged" || operations[index].kind === "modified") {
      result.push(operations[index]);
      index += 1;
      continue;
    }
    const removed: string[] = [];
    const added: string[] = [];
    while (index < operations.length && operations[index].kind !== "unchanged") {
      const operation = operations[index];
      if (operation.kind === "removed" && operation.before !== undefined) {
        removed.push(operation.before);
      }
      if (operation.kind === "added" && operation.after !== undefined) {
        added.push(operation.after);
      }
      index += 1;
    }
    const paired = Math.min(removed.length, added.length);
    for (let pair = 0; pair < paired; pair += 1) {
      result.push({ kind: "modified", before: removed[pair], after: added[pair] });
    }
    removed.slice(paired).forEach((line) =>
      result.push({ kind: "removed", before: line }),
    );
    added.slice(paired).forEach((line) =>
      result.push({ kind: "added", after: line }),
    );
  }
  if (suffix) {
    result.push(
      ...oldLines
        .slice(oldLines.length - suffix)
        .map((line) => ({ kind: "unchanged" as const, before: line, after: line })),
    );
  }
  return result;
};
