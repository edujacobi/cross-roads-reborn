"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const readSseData_js_1 = require("../../web-interface/utils/readSseData.js");
(0, vitest_1.describe)("SSE message framing", () => {
    (0, vitest_1.it)("joins split messages and UTF-8 characters without merging consecutive events", async () => {
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
        for await (const message of (0, readSseData_js_1.readSseData)(response))
            messages.push(message);
        (0, vitest_1.expect)(messages).toEqual(["{\"message\":\"prisão\"}", "{\"type\":\"closed\"}"]);
    });
    (0, vitest_1.it)("cancels the reader when the page stops after its terminal event", async () => {
        const cancel = vitest_1.vi.fn();
        const response = new Response(new ReadableStream({
            start(controller) {
                controller.enqueue(new TextEncoder().encode("data: {\"type\":\"rob-ended\"}\n\n"));
            },
            cancel,
        }));
        for await (const message of (0, readSseData_js_1.readSseData)(response)) {
            (0, vitest_1.expect)(message).toBe("{\"type\":\"rob-ended\"}");
            break;
        }
        (0, vitest_1.expect)(cancel).toHaveBeenCalledOnce();
        (0, vitest_1.expect)(response.body?.locked).toBe(false);
    });
    (0, vitest_1.it)("rejects failed HTTP responses before reading events", async () => {
        const stream = (0, readSseData_js_1.readSseData)(new Response(null, { status: 503 }));
        await (0, vitest_1.expect)(stream.next()).rejects.toThrow("SSE request failed: 503");
    });
});
//# sourceMappingURL=ReadSseData.test.js.map