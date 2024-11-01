export function useAssistant(
    options?:
        | AILanguageModelCreateOptionsWithSystemPrompt
        | AILanguageModelCreateOptionsWithoutSystemPrompt,
) {
    const [assistant, setAssistant] = useState<AILanguageModel>();
    const [assistantCapabilities, setAssistantCapabilities] = useState<
        AILanguageModelCapabilities
    >();
    const isSupportedBroswer = "ai" in window;

    useEffect(() => {
        if (!isSupportedBroswer) return;

        window.ai.languageModel.capabilities()
            .then(async (initialCapabilities) => {
                setAssistantCapabilities(initialCapabilities);

                if (initialCapabilities.available === "no") {
                    return;
                }

                let updatedCapabilities = initialCapabilities;
                while (updatedCapabilities.available === "after-download") {
                    await new Promise((res) => setTimeout(res, 100));
                    updatedCapabilities = await window.ai.languageModel
                        .capabilities();
                }
                setAssistantCapabilities(updatedCapabilities);

                if (updatedCapabilities.available !== "readily") return;

                window.ai.languageModel.create(options)
                    .then(setAssistant);
            });
    }, [options]);

    return {
        assistant,
        assistantCapabilities,
        isSupportedBroswer,
    };
}
