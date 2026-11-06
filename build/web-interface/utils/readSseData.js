// Our API sends single-line JSON data events separated by a blank line.
export async function* readSseData(response) {
    if (!response.ok || !response.body) {
        throw new Error(`SSE request failed: ${response.status}`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pendingData = "";
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                return;
            // A network chunk may contain part of an event or several complete events.
            pendingData += decoder.decode(value, { stream: true });
            const events = pendingData.split("\n\n");
            pendingData = events.pop() ?? "";
            for (const event of events) {
                if (event.startsWith("data: "))
                    yield event.slice(6);
            }
        }
    }
    finally {
        try {
            await reader.cancel();
        }
        finally {
            reader.releaseLock();
        }
    }
}
//# sourceMappingURL=readSseData.js.map