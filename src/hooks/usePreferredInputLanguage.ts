import useLocalStorageState from "use-local-storage-state";

export type InputLanguage = "en" | "es"

export default function usePreferredInputLanguage(): [InputLanguage, React.Dispatch<React.SetStateAction<InputLanguage>>] {
    const [preferredInputLanguage, setPreferredInputLanguage] = useLocalStorageState<InputLanguage>('preferred-input-language', { defaultValue: "en" })
    return [preferredInputLanguage, setPreferredInputLanguage]
}
