import { parseMarketSnapshot } from "../../src/domain/schemas";
import type { NormalizedJob } from "../../src/domain/types";
import { validSnapshot } from "./market-snapshot";

export const aiProductJob: NormalizedJob = parseMarketSnapshot(validSnapshot).jobs[0];
