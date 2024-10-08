import { useState } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import { useAssistant } from '@/hooks/useAssistant';
import { useMessage } from '@/hooks/useMessage';
import { Button, Input, Paper, Textarea } from '@mantine/core';
import classNames from 'classnames';

const ASSISTANT_OPTIONS: AIAssistantCreateOptionsWithSystemPrompt = {
  initialPrompts: [
    {
      role: "user",
      content: `sabía`
    },
    {
      role: "assistant",
      // TODO - don't do formatting with html
      content: `<p><strong>sabía</strong> I was knowing: Imperfect yo conjugation of saber.</p>
<p><strong>sabía</strong> he/she was knowing, you were knowing: Imperfect él/ella/usted conjugation of saber.</p>
<p><strong>sabia</strong> wise Feminine singular of sabio</p>`
    },
    {
      role: "user",
      content: `frontera`
    },
    {
      role: "assistant",
      // TODO - don't do formatting with html
      content: `<p><strong>frontera</strong>: border. <em>Feminine noun</em></p>`
    }
  ],
}

interface AssistantChatMessage extends AIAssistantAssistantPrompt {
  isPending: boolean
  timestamp: number
}

interface UserChatMessage extends AIAssistantUserPrompt {
  isPending: boolean
  timestamp: number
}

type ChatMessage = AssistantChatMessage | UserChatMessage

function App() {
  const assistant = useAssistant(ASSISTANT_OPTIONS)
  const contextMenuMessage = useMessage("chrome-ai-context-menu")
  const [conversation, setConversation] = useState<(ChatMessage)[]>([])
  const scrollableAreaRef = useRef<HTMLDivElement>(null)

  const getExplanation = useCallback(async (q: string) => {
    setOutput("")
    setConversation(prev => [...prev, { role: "user", content: q, isPending: false, timestamp: Date.now() }])
    setConversation(prev => [...prev, { role: "assistant", content: "", isPending: true, timestamp: Date.now() }])

    if (!assistant) {
      let waitTime = 0
      while (!assistant && waitTime < 10000) {
        await new Promise(res => setTimeout(res, 100))
        waitTime += 100
      }
      if (!assistant) {
        alert("Timed out waiting for ai assistant. Please try again.")
        return
      }
    }

    const streamResponse = assistant.promptStreaming(q)

    let lastChunk
    for await (const chunk of streamResponse) {
      setOutput(chunk)
      lastChunk = chunk
    }

    if (!lastChunk) return
    setConversation(prev => [...prev.filter(message => !message.isPending), { role: "assistant", content: lastChunk, timestamp: Date.now(), isPending: false }])
  }, [assistant])

  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")

  useEffect(() => {
    const selectionText = contextMenuMessage?.selectionText || ""
    if (!selectionText) return
    setConversation([])
    getExplanation(selectionText)
  }, [contextMenuMessage])

  useEffect(() => {
    if (!scrollableAreaRef.current) return
    scrollableAreaRef.current.scrollTo({ top: scrollableAreaRef.current.scrollHeight, behavior: "smooth" })
  }, [conversation])

  return (
    <div className='m-4'>
      <div
        ref={scrollableAreaRef}
        className='flex flex-col gap-4 min-h-32 max-h-96 overflow-scroll border-2 border-black p-2 rounded'
      >
        {
          conversation.map((message, i) => (
            <div
              key={`${message.role}-${message.timestamp}`}
              className={classNames(
                "inline w-max-4/5",
                {
                  "self-start": message.role === "assistant",
                  "self-end": message.role === "user",
                  "text-end": message.role === "user"
                }
              )}
            >
              <Paper
                dangerouslySetInnerHTML={
                  message.isPending
                    ? undefined
                    : { __html: message.content || "" }
                }
                withBorder
                p="xs"
                bg={message.role === "user" ? "cyan" : ""}
              >
                {message.isPending ? "..." : null}
              </Paper>
            </div>
          ))
        }
      </div>
      <form
        onSubmit={e => { e.preventDefault(); getExplanation(input); }}
        className='mt-4'
      >
        <Input onChange={e => setInput(e.target.value)} value={input} placeholder='Define something else...' />
        <Button className='mt-2'>Chat</Button>
      </form>
    </div>
  );
}

export default App;
