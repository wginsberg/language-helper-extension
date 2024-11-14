import useGeminiApiKey from "@/hooks/useGeminiApiKey"
import usePreferredModel, { Model } from "@/hooks/usePreferredModel"
import { Title, NavLink, PasswordInput, Select } from "@mantine/core"
import { Link } from "react-router-dom"

function Settings() {
    const [apiKey, setApiKey] = useGeminiApiKey()
    const [preferredModel, setPreferredModel] = usePreferredModel()

    const availableModels: Model[] = ["nano", "gemini-1.5-flash"]

    return (
        <div className='m-4'>
            <Title order={1} size="md">AI Spanish Helper | Settings</Title>
            <NavLink
                label="Home"
                leftSection={"🏡"}
                renderRoot={props => <Link to="/" {...props} />}
            />
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
                required
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
        </div>
    )
}

export default Settings
