import useLocalStorageState from "use-local-storage-state";

export default function useGeminiApiKey(): [string | undefined, React.Dispatch<React.SetStateAction<string | undefined>>] {
    const [apiKey, setApiKey] = useLocalStorageState<string>('gemini-api-key')
    return [apiKey, setApiKey]
}
