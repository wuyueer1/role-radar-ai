import { describe, expect, it } from "vitest";
import { buildClusterGraph } from "../../src/domain/clusters";
import { scoredJobsFixture } from "../fixtures/market-history";

describe("role-family clusters", () => {
  it("sizes role nodes by real jobs and links shared skills", () => {
    const graph = buildClusterGraph(scoredJobsFixture);
    expect(graph.nodes.reduce((sum, node) => sum + node.jobCount, 0)).toBe(
      scoredJobsFixture.length,
    );
    expect(graph.edges.every((edge) => edge.jaccard > 0 && edge.jaccard <= 1)).toBe(true);
    expect(graph.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y))).toBe(
      true,
    );
  });
});
