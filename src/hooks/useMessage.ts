import { onMessage } from "webext-bridge/popup";
import { ProtocolMap } from "webext-bridge";

export function useMessage(id: keyof ProtocolMap) {
    const [message, setMessage] = useState<ProtocolMap[typeof id]>()

    useEffect(() => {
        onMessage(id, ({ data }) => {
            console.log("recieved message", data?.selectionText)
            setMessage(data)
        })
        // TODO - cleanup useEffect?
        // https://github.com/serversideup/webext-bridge/issues?q=is%3Aissue+cleanup+
    }, [id])

    return message
}
