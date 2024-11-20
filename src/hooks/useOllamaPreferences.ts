import useLocalStorageState from "use-local-storage-state";

export function useOllamaURL(): [string | undefined, React.Dispatch<React.SetStateAction<string | undefined>>] {
    const [url, setURl] = useLocalStorageState<string>('ollama-url')
    return [url, setURl]
}

export function useOllamaModel(): [string | undefined, React.Dispatch<React.SetStateAction<string | undefined>>] {
    const [model, setModel] = useLocalStorageState<string>('ollama-model')
    return [model, setModel]
}
