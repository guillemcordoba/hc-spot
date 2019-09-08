export function parseResult(result) {
  if (typeof result === "string") result = JSON.parse(result);
  if (result.Err) throw new Error(JSON.stringify(result.Err));
  else return Object.keys(result).includes('Ok') ? result.Ok : result;
}

export function parseEntryResult(entryResult) {
  let result = parseResult(entryResult);

  if (!result) return result;

  if (result.result) result = result.result;
  if (result.Single) result = result.Single;
  
  const id = result.meta && result.meta.address;
  
  if (result.entry) result = result.entry;

  const ret = JSON.parse(result.App[1]);

  if (id) ret["id"] = id;

  return ret;
}

export function parseEntriesResults(entriesResults) {
  const result = parseResult(entriesResults);
  return result.map(r => parseEntryResult(r));
}
