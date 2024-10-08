export function useAssistant(options?: AIAssistantCreateOptionsWithSystemPrompt | AIAssistantCreateOptionsWithoutSystemPrompt) {
    const [assistant, setAssistant] = useState<AIAssistant>()

    useEffect(() => {
        window.ai.assistant.create(options)
            .then(setAssistant)
    }, [options])

    return assistant
}