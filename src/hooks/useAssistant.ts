import { ChatSession, Content, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SafetySetting } from "@google/generative-ai";
import useGeminiApiKey from "./useGeminiApiKey";
import usePreferredModel, { Model } from "./usePreferredModel";

const safetySettings: SafetySetting[] = [
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];


export function useAssistant({ initialPrompts }: { initialPrompts: Content[] }) {
    const [preferredModel] = usePreferredModel()
    
    const nanoAssistant = useGeminiNanoAssistant({ initialPrompts })
    const geminiFlashAssistant = useGeminiFlashAssistant({ initialPrompts })

    const assistant = useMemo(() => ({
        prompt: async (input: string): Promise<{ content: string, resolvedModel: Model }> => {
            if (preferredModel === "gemini-1.5-flash") {
                try {
                    const content = await geminiFlashAssistant.prompt(input)
                    if (!content) throw new Error("Empty response from gemini flash model")
                    return {
                        content,
                        resolvedModel: "gemini-1.5-flash"
                    }
                } catch (e) {
                    console.warn("Failed to get a response from Gemini Flash:", e)
                }
            }
            const content = await nanoAssistant.prompt(input)

            if (!content) throw new Error("Failed to get model output")

            return {
                content,
                resolvedModel: "nano"
            }
        }
    }), [preferredModel, geminiFlashAssistant, nanoAssistant])

    return assistant
}

function useGeminiNanoAssistant({ initialPrompts }: { initialPrompts: Content[] }) {

    const [languageModel, setLanguageModel] = useState<AILanguageModel>()

    useEffect(() => {
        const formattedInitialPrompts: AILanguageModelCreateOptionsWithoutSystemPrompt["initialPrompts"] = initialPrompts
            .map(({ role, parts }) => ({
                role: role === "model" ? "assistant" : "user",
                content: parts.map(({ text }) => text).join("\n")
            }))

        try {
            window.ai.languageModel.create({ initialPrompts: formattedInitialPrompts })
                .then(lm => setLanguageModel(lm))
        } catch (error) {
            console.warn("Failed to initialize Gemini Nano:", error)
        }
    }, [initialPrompts])


    const assistant = useMemo(() => ({
        prompt: async (input: string) => {
            if (!window["ai"]) throw "NANO_UNSUPPORTED"
            if (!languageModel) return
            const response = await languageModel.prompt(input)
            return response

        }
    }), [initialPrompts, languageModel]);

    return assistant
}

function useGeminiFlashAssistant({ initialPrompts }: { initialPrompts: Content[] }) {
    const [apiKey] = useGeminiApiKey()
    const [chatSession, setChatSession] = useState<ChatSession>()

    useEffect(() => {
        if (!apiKey) return

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            safetySettings,
            model: "gemini-1.5-flash",
            systemInstruction:
                "You are a spanish tutor. You explain words concisely without exposition",
        })
        setChatSession(model.startChat({ history: initialPrompts }))
    }, [apiKey, initialPrompts])

    const assistant = useMemo(() => ({
        prompt: async (input: string) => {
            if (!apiKey) throw { errorDetails: [{ reason: "API_KEY_INVALID" }] }
            const result = await chatSession?.sendMessage(input)
            return result?.response.text()
        }
    }), [chatSession]);

    return assistant
}