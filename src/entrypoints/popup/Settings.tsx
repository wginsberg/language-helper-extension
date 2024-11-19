import useGeminiApiKey from "@/hooks/useGeminiApiKey"
import { useOllamaURL, useOllamaModel } from "@/hooks/useOllamaPreferences"
import usePreferredInputLanguage, { InputLanguage } from "@/hooks/usePreferredInputLanguage"
import usePreferredModel, { Model } from "@/hooks/usePreferredModel"
import { Title, NavLink, PasswordInput, Select, TextInput, Space, Divider } from "@mantine/core"
import { Link } from "react-router-dom"

function Settings() {
    const [apiKey, setApiKey] = useGeminiApiKey()
    const [preferredModel, setPreferredModel] = usePreferredModel()
    const [ollamaURL, setOllamaURL] = useOllamaURL()
    const [ollamaModel, setOllamaModel] = useOllamaModel()
    const [inputLanguage, setInputLanguage] = usePreferredInputLanguage()

    const availableModels: { label: string, value: Model }[] = [
        {
            value: "nano",
            label: "🐣 Gemini Nano"
        },
        {
            value: "gemini-1.5-flash",
            label: "⚡️ Gemini 1.5 Flash"
        },
        {
            value: "tinyllama",
            label: "🦙 Ollama"
        },
    ]

    const availableLanguages: { label: string, value: InputLanguage }[] = [
        {
            value: "en",
            label: "English"
        },
        {
            value: "es",
            label: "Spanish"
        }
    ]

    return (
        <div className='m-4'>
            <Title order={1} size="md">AI Language Helper | Settings</Title>
            <NavLink
                label="Home"
                leftSection={"🏡"}
                renderRoot={props => <Link to="/" {...props} />}
            />
            <Select
                label="Input Language"
                defaultValue={inputLanguage}
                data={availableLanguages}

                onChange={e => {
                    if (e === inputLanguage) return
                    setInputLanguage(e as InputLanguage)
                }}
            />
            <Space h={8} />
            <Divider my="md" />
            <Select
                label="Model"
                defaultValue={preferredModel}
                data={availableModels}

                onChange={e => {
                    if (e === preferredModel) return
                    setPreferredModel(e as Model)
                }}
            />
            <Space h={8} />
            <PasswordInput
                disabled={preferredModel !== "gemini-1.5-flash"}
                label="Gemini API Key"
                placeholder="Paste your API key here"
                onChange={e => {
                    const newValue = e.target.value
                    if (newValue === apiKey) return
                    setApiKey(newValue)
                }}
                defaultValue={apiKey}
                defaultVisible={true}

            />
            <Space h={8} />
            <TextInput
                disabled={preferredModel !== "tinyllama"}
                label="Ollama URL"
                placeholder="http://localhost:11434"
                onChange={e => {
                    const newValue = e.target.value
                    if (newValue === ollamaURL) return
                    setOllamaURL(newValue)
                }}
                defaultValue={ollamaURL}
            />
            <Space h={8} />
            <TextInput
                disabled={preferredModel !== "tinyllama"}
                label="Ollama Model"
                placeholder="tinyllama"
                onChange={e => {
                    const newValue = e.target.value
                    if (newValue === ollamaModel) return
                    setOllamaModel(newValue)
                }}
                defaultValue={ollamaModel}
            />
        </div>
    )
}

export default Settings
