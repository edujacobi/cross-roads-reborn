import { describe, expect, it, vi } from "vitest";
import { readSseData } from "../../web-interface/utils/readSseData.js";

describe("SSE message framing", () => {
	it("joins split messages and UTF-8 characters without merging consecutive events", async () => {
		const encoder = new TextEncoder();
		const firstMessage = encoder.encode("data: {\"message\":\"prisão\"}\n\n");
		const accentedCharacter = firstMessage.indexOf(0xc3);
		const response = new Response(new ReadableStream({
			start(controller) {
				controller.enqueue(firstMessage.slice(0, accentedCharacter + 1));
				controller.enqueue(firstMessage.slice(accentedCharacter + 1, -1));
				controller.enqueue(encoder.encode("\ndata: {\"type\":\"closed\"}\n\n"));
				controller.close();
			},
		}));
		const messages = [];
		for await (const message of readSseData(response)) messages.push(message);
		expect(messages).toEqual(["{\"message\":\"prisão\"}", "{\"type\":\"closed\"}"]);
	});

	it("cancels the reader when the page stops after its terminal event", async () => {
		const cancel = vi.fn();
		const response = new Response(new ReadableStream({
			start(controller) {
				controller.enqueue(new TextEncoder().encode("data: {\"type\":\"rob-ended\"}\n\n"));
			},
			cancel,
		}));

		for await (const message of readSseData(response)) {
			expect(message).toBe("{\"type\":\"rob-ended\"}");
			break;
		}

		expect(cancel).toHaveBeenCalledOnce();
		expect(response.body?.locked).toBe(false);
	});

	it("rejects failed HTTP responses before reading events", async () => {
		const stream = readSseData(new Response(null, { status: 503 }));
		await expect(stream.next()).rejects.toThrow("SSE request failed: 503");
	});
});
