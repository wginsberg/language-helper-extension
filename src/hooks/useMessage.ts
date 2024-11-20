import { onMessage } from "webext-bridge/popup";
import { GetDataType, ProtocolMap } from "webext-bridge";

export function useMessage(id: keyof ProtocolMap) {
    const [message, setMessage] = useState<GetDataType<typeof id>>()

    useEffect(() => {
        onMessage(id, ({ data }) => {
            setMessage(data)
        })
        // TODO - cleanup useEffect?
        // https://github.com/serversideup/webext-bridge/issues?q=is%3Aissue+cleanup+
    }, [id])

    return message
}
