import { ChatSession, Content, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SafetySetting } from "@google/generative-ai";
import useGeminiApiKey from "./useGeminiApiKey";
import usePreferredModel, { Model } from "./usePreferredModel";
import { useOllamaURL, useOllamaModel } from "./useOllamaPreferences";

type Assistant = {
    prompt: (input:string) => Promise<{ content: string, resolvedModel: Model } | undefined>
}

type UseAssistantHook = ({ initialPrompts }: { initialPrompts: Content[] }) => Assistant

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


export const useAssistant: UseAssistantHook = function ({ initialPrompts }) {
    const [preferredModel] = usePreferredModel()
    
    const nanoAssistant = useGeminiNanoAssistant({ initialPrompts })
    const geminiFlashAssistant = useGeminiFlashAssistant({ initialPrompts })
    const tinyLlamaAssistant = useOllamaAssistant({ initialPrompts })

    const assistant: Assistant = useMemo(() => ({
        prompt: async (input: string): Promise<{ content: string, resolvedModel: Model }> => {
            if (preferredModel === "tinyllama") {
                const response = await tinyLlamaAssistant.prompt(input)
                if (response?.content) {
                    return response
                }
            }
            if (preferredModel === "gemini-1.5-flash") {
                try {
                    const response = await geminiFlashAssistant.prompt(input)
                    if (!response?.content) throw new Error("Empty response from gemini flash model")
                    return response
                } catch (e) {
                    console.warn("Failed to get a response from Gemini Flash:", e)
                }
            }
            const response = await nanoAssistant.prompt(input)

            if (!response?.content) throw new Error("Failed to get model output")

            return response
        }
    }), [preferredModel, geminiFlashAssistant, nanoAssistant])

    return assistant
}

const useGeminiNanoAssistant: UseAssistantHook = function ({ initialPrompts }) {

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


    const assistant: Assistant = useMemo(() => ({
        prompt: async (input: string) => {
            if (!window["ai"]) throw "NANO_UNSUPPORTED"
            if (!languageModel) return
            const response = await languageModel.prompt(input)
            return {
                content: response,
                resolvedModel: "nano"
            }

        }
    }), [initialPrompts, languageModel]);

    return assistant
}

const useGeminiFlashAssistant: UseAssistantHook = function ({ initialPrompts }) {
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

    const assistant: Assistant = useMemo(() => ({
        prompt: async (input: string) => {
            if (!apiKey) throw { errorDetails: [{ reason: "API_KEY_INVALID" }] }
            const result = await chatSession?.sendMessage(input)
            const content = result?.response.text()
            if (!content) throw "empty response"
            return {
                content,
                resolvedModel: "gemini-1.5-flash"
            }
        }
    }), [chatSession]);

    return assistant
}

const useOllamaAssistant: UseAssistantHook = function ({ initialPrompts }) {
    const [url] = useOllamaURL()
    const [ollamaModel] = useOllamaModel()

    const assistant: Assistant = useMemo(() => ({
        prompt: async (input: string) => {
            if (!url) return

            const formattedInitialPrompts = initialPrompts
                .map(({ role, parts }) => ({
                    role: role === "model" ? "assistant" : "user",
                    content: parts.map(({ text }) => text).join("\n")
                }))

            const messages = [
                ...formattedInitialPrompts,
                {
                    role: "user",
                    content: input
                }
            ]
            const reqBody = {
                messages,
                model: ollamaModel,
                stream: false,
                system: "You are a spanish tutor. You provide short explanations of words, their definitions, and conjugations. Do not give examples in your responses."
            }

            console.log(reqBody)

            const content = await fetch(url, {
                method: "POST",
                body: JSON.stringify(reqBody),
                headers: {
                    "Content-Type": "application/json"
                }
            })
                .then((response) => {
                    if (response.status !== 404) return response
                    throw "MODEL_NOT_FOUND"
                })
                .then(response => response.json())
                .then(({ message: { content } }) => content)

            return {
                content,
                resolvedModel: "tinyllama"
            }
        }
    }), [initialPrompts, url, ollamaModel])

    return assistant
}
