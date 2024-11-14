import { ChatSession, Content, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SafetySetting } from "@google/generative-ai";
import useGeminiApiKey from "./useGeminiApiKey";

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
        prompt: async (prompt: string) => {
            if (!apiKey) throw { errorDetails: [{ reason: "API_KEY_INVALID" }] }
            const result = await chatSession?.sendMessage(prompt)
            return result?.response.text()
        }
    }), [chatSession]);

    return {
        assistant,
    };
}
