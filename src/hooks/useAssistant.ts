import { ChatSession, Content, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SafetySetting } from "@google/generative-ai";
const GEMINI_API_KEY = "AIzaSyAZhQXKuWg1RYRG_YwTbxsWtJPam4AiFP4"

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
    const [chatSession, setChatSession] = useState<ChatSession>()

    useEffect(() => {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({
            safetySettings,
            model: "gemini-1.5-flash",
            systemInstruction:
                "You are a spanish tutor. You explain words concisely without exposition",
        })
        setChatSession(model.startChat({ history: initialPrompts }))
    }, [initialPrompts])


    const assistant = {
        prompt: useCallback(async (prompt: string) => {
            const result = await chatSession?.sendMessage(prompt)
            return result?.response.text()
        }, [chatSession])
    };

    return {
        assistant,
    };
}
