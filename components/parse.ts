import { IncludeOption } from "popn-db-js";

export function parseIncludeOption(s: string): IncludeOption {
  const sl = s?.toLowerCase();
  switch (sl) {
    case "only":
      return "only";
    case "exclude":
      return "exclude";
    default:
      return "include";
  }
}

export const parseIncludeOptionSafe = parseIncludeOption;
