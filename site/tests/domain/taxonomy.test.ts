import { describe, expect, it } from "vitest";
import {
  classifyRoleFamily,
  extractSkills,
  normalizeLocation,
} from "../../src/domain/taxonomy";

describe("job taxonomy", () => {
  it("extracts Chinese and English aliases without duplicates", () => {
    expect(extractSkills("熟悉 RAG、向量数据库 and prompt engineering")).toEqual([
      "rag",
      "vector-databases",
      "prompt-engineering",
    ]);
  });

  it("classifies an AI product role before generic data terms", () => {
    expect(classifyRoleFamily("AI 产品经理", ["user-research", "llm"])).toBe("ai-product");
  });

  it("recognizes the default Asia market", () => {
    expect(normalizeLocation("Remote - Asia / Hong Kong").marketScope).toBe("default");
    expect(normalizeLocation("London, UK").marketScope).toBe("global");
  });
});
