import { ChatSession, Content, GenerateContentStreamResult, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SafetySetting } from "@google/generative-ai";
import useGeminiApiKey from "./useGeminiApiKey";
import usePreferredModel, { Model } from "./usePreferredModel";
import { useOllamaURL, useOllamaModel } from "./useOllamaPreferences";
import { Ollama } from "ollama"

type Assistant = {
    prompt: (input:string) => AsyncGenerator<
        { success: true, response: { content: string, resolvedModel: Model } }
        | { success: false,  error: AssistantError }
        | undefined
    >
}

type UseAssistantHook = ({ initialPrompts }: { initialPrompts: Content[] }) => Assistant

type AssistantError = {
    friendlyErrorTitle: string
    friendlyErrorDescription: string
}

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
        prompt: async function * (input: string) {
            let assistant: Assistant
            switch (preferredModel) {
               case "tinyllama":
                    assistant = tinyLlamaAssistant
                    break
                    // return tinyLlamaAssistant.prompt(input)
               case "gemini-1.5-flash":
                    assistant = geminiFlashAssistant
                    break
                    return geminiFlashAssistant.prompt(input)
               default:
                    assistant = nanoAssistant
                    break
                    // return nanoAssistant.prompt(input)
            }
            for await (const part of assistant.prompt(input)) {
                yield part
            }
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
        prompt: async function * (input: string) {
            if (!window["ai"]) {
                return {
                    success: false,
                    error: {
                        friendlyErrorTitle: "Model not supported",
                        friendlyErrorDescription: "Gemini Nano is not available in this browser"
                    }
                }
            }
            if (!languageModel) {
                return {
                    success: false,
                    error: {
                        friendlyErrorTitle: "Unexpected error",
                        friendlyErrorDescription: "Gemini Nano is not initialized"
                    }
                }
            }

            let error: AssistantError | undefined = undefined
            let result: ReadableStream<string> | undefined = undefined

            try {
                result = await languageModel.promptStreaming(input)
            } catch {
                error = {
                    friendlyErrorTitle: "Unexpected Error",
                    friendlyErrorDescription: "Empty response from Gemini Flash"
                }
            }

            if (!result || error) {
                return {
                    success: false,
                    error
                }
            }


            let count = 0
            for await (const part of result) {
                const chunk = part.slice(count)
                count += chunk.length
                yield {
                    success: true,
                    response: {
                        content: chunk,
                        resolvedModel: "nano" as Model
                    }
                }
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
        prompt: async function * (input: string) {
            if (!apiKey) {
                return {
                    success: false,
                    error: {
                        friendlyErrorTitle: "Bad API Key",
                        friendlyErrorDescription: "Missing API Key for Gemini Flash"
                    }
                }
            }

            let error: AssistantError | undefined = undefined
            let result: GenerateContentStreamResult | undefined = undefined
            try {
                result = await chatSession?.sendMessageStream(input)
            } catch {
                error = {
                    friendlyErrorTitle: "Unexpected Error",
                    friendlyErrorDescription: "Empty response from Gemini Flash"
                }
            }

            if (error || !result) return {
                success: false,
                error
            }

            for await (const part of result.stream) {
                yield {
                    success: true,
                    response: {
                        content: part?.text(),
                        resolvedModel: "gemini-1.5-flash"
                    }
                }
            }

        }
    }), [chatSession]);

    return assistant
}


// TODO - maintain sessions
const useOllamaAssistant: UseAssistantHook = function ({ initialPrompts }) {
    const [url] = useOllamaURL()
    const [ollamaModel] = useOllamaModel()

    const assistant: Assistant = useMemo(() => ({
        prompt: async function * (input: string) {
            if (!ollamaModel) {
                return {
                    success: false,
                    error: {
                        friendlyErrorTitle: "Bad model",
                        friendlyErrorDescription: "Missing model for Ollama"
                    }
                }
            }

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

            // TODO - add system message
            const ollama = new Ollama({ host: url })
            let error: AssistantError | undefined = undefined
            const result = await ollama.chat({
                messages,
                model: ollamaModel,
                stream: true,
            }).catch(e => {
                if (e?.status_code === 404) {
                    error = {
                        friendlyErrorTitle: "Not found (404)",
                        friendlyErrorDescription: "Unable to get response from Ollama"
                    }
                }
            })

            if (error) {
                return {
                    success: false,
                    error
                }
            }

            if (!result) {
                return {
                    success: false,
                    error: {
                        friendlyErrorTitle: "Unexpected error",
                        friendlyErrorDescription: "Unable to get response from Ollama"
                    }
                }
            }

            for await (const part of result) {
                yield {
                    success: true,
                    response: {
                        content: part.message.content,
                        resolvedModel: ollamaModel as Model
                    }
                }
            }
        }
    }), [initialPrompts, url, ollamaModel])

    return assistant
}
