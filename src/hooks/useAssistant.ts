import { ChatSession, Content, GenerateContentStreamResult, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SafetySetting } from "@google/generative-ai";
import useGeminiApiKey from "./useGeminiApiKey";
import usePreferredModel, { Model } from "./usePreferredModel";
import { useOllamaURL, useOllamaModel } from "./useOllamaPreferences";
import { Ollama } from "ollama/browser"

type Assistant = {
    prompt: (input:string) => AsyncGenerator<
        { success: true, response: { content: string, resolvedModel: Model } }
        | { success: false,  error: AssistantError }
        | undefined
    >
}

type UseAssistantHook = ({ systemPrompt, initialPrompts }: { systemPrompt: string,  initialPrompts: Content[] }) => Assistant

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


export const useAssistant: UseAssistantHook = function ({ systemPrompt, initialPrompts }) {
    const [preferredModel] = usePreferredModel()
    
    const nanoAssistant = useGeminiNanoAssistant({ systemPrompt, initialPrompts })
    const geminiFlashAssistant = useGeminiFlashAssistant({ systemPrompt, initialPrompts })
    const tinyLlamaAssistant = useOllamaAssistant({ systemPrompt, initialPrompts })

    const assistant: Assistant = useMemo(() => ({
        prompt: async function * (input: string) {
            let assistant: Assistant
            switch (preferredModel) {
               case "tinyllama":
                    assistant = tinyLlamaAssistant
                    break
               case "gemini-1.5-flash":
                    assistant = geminiFlashAssistant
                    break
               default:
                    assistant = nanoAssistant
                    break
            }
            for await (const part of assistant.prompt(input)) {
                yield part
            }
        }
    }), [preferredModel, geminiFlashAssistant, nanoAssistant])

    return assistant
}

const useGeminiNanoAssistant: UseAssistantHook = function ({ systemPrompt, initialPrompts }) {

    const [languageModel, setLanguageModel] = useState<AILanguageModel>()

    useEffect(() => {
        const formattedInitialPrompts: AILanguageModelCreateOptionsWithoutSystemPrompt["initialPrompts"] = initialPrompts
            .map(({ role, parts }) => ({
                role: role === "model" ? "assistant" : "user",
                content: parts.map(({ text }) => text).join("\n")
            }))

        try {
            console.log(systemPrompt)
            window.ai.languageModel.create({
                systemPrompt,
                initialPrompts: formattedInitialPrompts,
                temperature: 0.01,
                topK: 1
            })
                .then(lm => setLanguageModel(lm))
        } catch (error) {
            console.warn("Failed to initialize Gemini Nano:", error)
        }
    }, [initialPrompts])


    const assistant: Assistant = useMemo(() => ({
        prompt: async function * (input: string) {
            if (!window["ai"]) {
                yield {
                    success: false,
                    error: {
                        friendlyErrorTitle: "Model not supported",
                        friendlyErrorDescription: "Gemini Nano is not available in this browser"
                    }
                }
                return
            }
            if (!languageModel) {
                yield {
                    success: false,
                    error: {
                        friendlyErrorTitle: "Unexpected error",
                        friendlyErrorDescription: "Gemini Nano is not initialized"
                    }
                }
                return
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
                yield {
                    success: false,
                    error: {
                        friendlyErrorTitle: "Unexpected Error",
                        friendlyErrorDescription: "Empty response from Gemini Flash"
                    }
                }
                return
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

const useGeminiFlashAssistant: UseAssistantHook = function ({ systemPrompt, initialPrompts }) {
    const [apiKey] = useGeminiApiKey()
    const [chatSession, setChatSession] = useState<ChatSession>()

    useEffect(() => {
        if (!apiKey) return

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
            safetySettings,
            model: "gemini-1.5-flash",
            systemInstruction: systemPrompt
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
                console.log("Making request")
                result = await chatSession?.sendMessageStream(input)
            } catch {
                console.log("handled error")
                error = {
                    friendlyErrorTitle: "Unexpected Error",
                    friendlyErrorDescription: "Empty response from Gemini Flash"
                }
            }

            if (error || !result) return {
                success: false,
                error
            }
            console.log("waiting for response...")
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
