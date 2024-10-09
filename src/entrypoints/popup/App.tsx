import { useState } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import { useAssistant } from '@/hooks/useAssistant';
import { useMessage } from '@/hooks/useMessage';
import { Alert, Button, Input, Loader, LoadingOverlay, Paper, Space, Textarea, Title, Transition } from '@mantine/core';
import classNames from 'classnames';
import Ellipses from '@/components/ellipses';

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
    },
    {
      role: "user",
      content: `chévere`
    },
    {
      role: "assistant",
      // TODO - don't do formatting with html
      content: `<p><strong>chévere</strong>: great. <em>Adjective</em></p> (colloquial) (extremely good) (Latin America)`
    }
  ],
}

type ChatMessage = AIAssistantPrompt & {
  id: number
  isPending?: boolean
}

function App() {
  const { assistant, assistantCapabilities, isSupportedBroswer } = useAssistant(ASSISTANT_OPTIONS)
  const contextMenuMessage = useMessage("chrome-ai-context-menu")
  const [input, setInput] = useState("")
  const [conversation, setConversation] = useState<(ChatMessage)[]>([])
  const [pendingPrompt, setPendingPrompt] = useState("")
  const scrollableAreaRef = useRef<HTMLDivElement>(null)

  const getExplanation = useCallback((prompt: string) => {
    setPendingPrompt(prompt)
  }, [])

  // Handle context menu click
  useEffect(() => {
    const selectionText = contextMenuMessage?.selectionText || ""
    if (!selectionText) return
    setConversation([])
    getExplanation(selectionText)
  }, [contextMenuMessage])

  // Scroll to bottom on new message
  useEffect(() => {
    if (!scrollableAreaRef.current) return
    scrollableAreaRef.current.scrollTo({ top: scrollableAreaRef.current.scrollHeight, behavior: "smooth" })
  }, [conversation])

  // AI prompt
  useEffect(() => {
    if (!pendingPrompt) return
    if (!assistant) return

    setConversation(prev => [...prev, { role: "user", content: pendingPrompt, isPending: false, id: Date.now() }])
    setConversation(prev => [...prev, { role: "assistant", content: "", isPending: true, id: Date.now() }])

    setPendingPrompt("")

    // TODO streaming
    assistant.prompt(pendingPrompt)
      .then(result => {
        setConversation(prev => [
          ...prev.filter(message => !message.isPending),
          {
            role: "assistant",
            content: result,
            id: Date.now()
          }
        ])
        setInput("")
      })
  }, [pendingPrompt, assistant])

  // Language detection of input
  const detectedLanguage = input.startsWith("!en")
    ? "en"
    : input.startsWith("!es")
      ? "es"
      : undefined

  const getTranslation = useCallback((targetLanguage: string) => {
    const formattedTarget = targetLanguage === "en"
      ? "English"
      : "Spanish"

    // TODO - remove once automatic language detection works
    const formattedInput = input.replace(/\!e\w/, "")

    // TODO - change to translation API when it works
    getExplanation(`Translate "${formattedInput}" to ${formattedTarget}`)
  }, [input])

  if (!isSupportedBroswer) {
    return (
      <div className='m-4'>
        <Alert color="red" title="Unsupported browser">
          Looks like the browser you are using does not support this browser extension.
        </Alert>
      </div>
    )
  }

  return (
    <div className='m-4'>
      <div
        ref={scrollableAreaRef}
        className='flex flex-col gap-4 min-h-32 max-h-96 overflow-scroll border-2 border-black p-2 rounded'
      >
        {
          !assistant &&
          <div className='flex justify-center items-center grow'>
            <Loader />
          </div>
        }
        {
          conversation.map((message, i) => (
            <div
              key={`${message.role}-${message.id}`}
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
                {message.isPending ? <Ellipses /> : null}
              </Paper>
            </div>
          ))
        }
      </div>
      <form
        onSubmit={e => { e.preventDefault(); getExplanation(input); }}
        className='mt-4'
      >
        <Input
          onChange={e => setInput(e.target.value)}
          value={input}
          placeholder='Define something else...'
          disabled={!assistant}
        />
        <div className='relative mt-2'>
          <Button disabled={!assistant}>
            Chat
          </Button>
          <div className='absolute right-0 top-0'>
            <Transition mounted={detectedLanguage === "en"}>
              {
                styles =>
                  <Button style={styles} color="green" onClick={() => getTranslation("es")}>
                    Translate to Spanish
                  </Button>
              }
            </Transition>
          </div>
          <div className='absolute right-0 top-0'>
            <Transition mounted={detectedLanguage === "es"}>
              {
                styles =>
                  <Button style={styles} color="green" onClick={() => getTranslation("en")}>
                    Translate to English
                  </Button>
              }
            </Transition>
          </div>
        </div>
      </form>
    </div>
  );
}

export default App;
