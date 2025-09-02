import { describe, it, expect } from "vitest";
import { extractAskText } from "../src/utils";

describe("extractAskText", () => {
	it("should extract the text after 'ask'", () => {
		const text = "<@U12345> ask What is the weather like?";
		expect(extractAskText(text)).toBe("What is the weather like?");
	});

	it("should return an empty string if 'ask' is not present", () => {
		const text = "<@U12345> some other command";
		expect(extractAskText(text)).toBe("");
	});

	it("should handle extra whitespace", () => {
		const text = "<@U12345>  ask   What is the capital of France?  ";
		expect(extractAskText(text)).toBe("What is the capital of France?");
	});

	it("should be case-insensitive", () => {
		const text = "<@U12345> ASK what is 2+2?";
		expect(extractAskText(text)).toBe("what is 2+2?");
	});

	it("should return empty string for empty input", () => {
		const text = "";
		expect(extractAskText(text)).toBe("");
	});
});
