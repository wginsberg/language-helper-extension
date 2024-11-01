export function useAssistant(
    options?:
        | AILanguageModelCreateOptionsWithSystemPrompt
        | AILanguageModelCreateOptionsWithoutSystemPrompt,
) {
    const [history, setHistory] = useState(options?.initialPrompts);
    const assistant = {
        prompt: async (prompt: string) => {
            const response = await fetch("http://localhost:3000/api/chat", {
                method: "POST",
                body: JSON.stringify({
                    prompt,
                    history,
                }),
                headers: {
                    "Content-type": "application/json",
                },
            });
            const json = await response.json();
            setHistory(json.history);
            return json.text;
        },
    };

    return {
        assistant,
    };
}
