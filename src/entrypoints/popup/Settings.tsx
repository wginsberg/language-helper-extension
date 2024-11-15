import useGeminiApiKey from "@/hooks/useGeminiApiKey"
import { useOllamaURL, useOllamaModel } from "@/hooks/useOllamaPreferences"
import usePreferredModel, { Model } from "@/hooks/usePreferredModel"
import { Title, NavLink, PasswordInput, Select, TextInput, Space } from "@mantine/core"
import { Link } from "react-router-dom"

function Settings() {
    const [apiKey, setApiKey] = useGeminiApiKey()
    const [preferredModel, setPreferredModel] = usePreferredModel()
    const [ollamaURL, setOllamaURL] = useOllamaURL()
    const [ollamaModel, setOllamaModel] = useOllamaModel()


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

    return (
        <div className='m-4'>
            <Title order={1} size="md">AI Spanish Helper | Settings</Title>
            <NavLink
                label="Home"
                leftSection={"🏡"}
                renderRoot={props => <Link to="/" {...props} />}
            />
            <Select
                label="Preferred model"
                defaultValue={preferredModel}
                data={availableModels}

                onChange={e => {
                    if (e === preferredModel) return
                    setPreferredModel(e as Model)
                }}
            />
            <Space h={8} />
            <PasswordInput
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
                label="Ollama URL (optional)"
                placeholder="http://localhost:11434/api/chat"
                onChange={e => {
                    const newValue = e.target.value
                    if (newValue === ollamaURL) return
                    setOllamaURL(newValue)
                }}
                defaultValue={ollamaURL}
            />
            <Space h={8} />
            <TextInput
                label="Ollama Model (optional)"
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
