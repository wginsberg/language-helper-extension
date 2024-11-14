import useGeminiApiKey from "@/hooks/useGeminiApiKey"
import { Title, NavLink, PasswordInput } from "@mantine/core"
import { Link } from "react-router-dom"

function Settings() {
    const [apiKey, setApiKey] = useGeminiApiKey()
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
        </div>
    )
}

export default Settings
