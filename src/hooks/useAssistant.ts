export function useAssistant(options?: AIAssistantCreateOptionsWithSystemPrompt | AIAssistantCreateOptionsWithoutSystemPrompt) {
    const [assistant, setAssistant] = useState<AIAssistant>()
    const [assistantCapabilities, setAssistantCapabilities] = useState<AIAssistantCapabilities>()
    const isSupportedBroswer = "ai" in window

    useEffect(() => {
        if (!isSupportedBroswer) return

        window.ai.assistant.capabilities()
            .then(async initialCapabilities => {
                setAssistantCapabilities(initialCapabilities)

                if (initialCapabilities.available === "no") {
                    return
                }

                let updatedCapabilities = initialCapabilities
                while (updatedCapabilities.available === "after-download") {
                    await new Promise(res => setTimeout(res, 100))
                    updatedCapabilities = await window.ai.assistant.capabilities()
                }
                setAssistantCapabilities(updatedCapabilities)

                if (updatedCapabilities.available !== "readily") return

                window.ai.assistant.create(options)
                    .then(setAssistant)
            })
    }, [options])


    return {
        assistant,
        assistantCapabilities,
        isSupportedBroswer
    }
}
