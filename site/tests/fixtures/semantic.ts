import profileJson from "../../data/candidate-profile.json";
import { parseCandidateProfile } from "../../src/domain/schemas";
import { scoredJobsFixture } from "./market-history";

export const PROFILE = parseCandidateProfile(profileJson);
export const JOBS = scoredJobsFixture.slice(0, 3);
