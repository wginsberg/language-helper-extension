import useLocalStorageState from "use-local-storage-state";

export type Model = "nano" | "gemini-1.5-flash"

export default function usePreferredModel(): [Model, React.Dispatch<React.SetStateAction<Model>>] {
    const [preferredModel, setPreferredModel] = useLocalStorageState<Model>('preferred-model', { defaultValue: "nano" })
    return [preferredModel, setPreferredModel]
}
