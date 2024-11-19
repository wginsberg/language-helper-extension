import { useState } from 'react';
import { useAssistant } from '@/hooks/useAssistant';
import { useMessage } from '@/hooks/useMessage';
import { Button, Input, Loader, NavLink, Paper, Title, Tooltip, Transition } from '@mantine/core';
import { notifications } from "@mantine/notifications"
import classNames from 'classnames';
import Ellipses from '@/components/ellipses';
import Markdown from 'react-markdown';
import { Link } from 'react-router-dom';


const ASSISTANT_OPTIONS_EN = {
  systemPrompt: "You provide definitions and explanations of English words. You may be given a sentence to use for context but do not comment on it.",
  initialPrompts: [
    {
      role: "user",
      parts: [{ text: `distribution` }]
    },
    {
      role: "model",
      parts: [{ text: `**distribution (distribute)**: The act of sharing or spreading something. _Noun form of distribute._` }]
    },
    {
      role: "user",
      parts: [{ text: `scolding in the context "My boss hadn't yet finished scolding me"` }]
    },
    {
      role: "model",
      parts: [{ text: `**scolding (scold)**: The act of reprimanding or criticizing someone angrily. _Gerund or present participle of scold._` }]
    },
  ]
}

const ASSISTANT_OPTIONS_ES = {
  systemPrompt: "You provide definitions and explanations of Spanish words. You may be given a sentence to use for context but do not comment on it. You only output English explanations.",
  initialPrompts: [
    {
      role: "user",
      parts: [{ text: `sabía` }]
    },
    {
      role: "model",
      parts: [{ text: `**sabía (saber)**: I knew, he/she/you (formal) knew. _Past tense conjugation of saber_.` }]
    },
    {
      role: "user",
      parts: [{ text: `frontera` }]
    },
    {
      role: "model",
      parts: [{ text: `**frontera**: border. _Feminine noun_` }]
    },
    {
      role: "user",
      parts: [{ text: `chévere` }]
    },
    {
      role: "model",
      parts: [{ text: `**chévere**: great. _Adjective_\n(colloquial) (extremely good) (Latin America)` }]
    },
    {
      role: "user",
      parts: [{ text: `"tienen" from the sentence "Todas las actividades económicas del sector tienen su fundamento en la explotación de los recursos que la tierra origina, favorecida por la acción del ser humano: alimentos vegetales como cereales, frutas, hortalizas, pastos cultivados y forrajes; fibras utilizadas por la industria textil; cultivos energéticos etc."` }]
    },
    {
      role: "model",
      parts: [{ text: `**tienen (tener)**: they have, you have (formal). _Present tense third person plural conjugation of tener_.` }]
    },
  ]
}

const ASSISTANT_OPTIONS = {
  "en": ASSISTANT_OPTIONS_EN,
  "es": ASSISTANT_OPTIONS_ES
}

type ChatMessage = AILanguageModelPrompt & {
  id: number
  isPending?: boolean
  shortContent?: string
}


function App() {
  const [inputLanguage] = usePreferredInputLanguage()
  const assistant = useAssistant(ASSISTANT_OPTIONS[inputLanguage])
  const contextMenuMessage = useMessage("chrome-ai-context-menu")
  const [input, setInput] = useState("")
  const [conversation, setConversation] = useState<(ChatMessage)[]>([])
  const [pendingPrompt, setPendingPrompt] = useState<{ prompt: string, shortPrompt?: string }>()
  const scrollableAreaRef = useRef<HTMLDivElement>(null)

  const getExplanation = useCallback((prompt: string, shortPrompt?: string) => {
    setPendingPrompt({ prompt, shortPrompt })
  }, [])

  // Handle context menu click
  useEffect(() => {
    const selectionText = contextMenuMessage?.selectionText || ""
    const surroundingText = contextMenuMessage?.surroundingText || ""
    if (!selectionText) return

    const prompt = surroundingText && surroundingText !== selectionText
      ? `"${selectionText}" in the context "${surroundingText}"`
      : selectionText

    const shortPrompt = surroundingText && surroundingText !== selectionText
      ? selectionText
      : undefined

    setConversation([])
    setPendingPrompt({ prompt, shortPrompt })
  }, [contextMenuMessage])

  // Scroll to bottom on new message
  useEffect(() => {
    if (!scrollableAreaRef.current) return
    scrollableAreaRef.current.lastElementChild?.scrollIntoView({ behavior: "smooth" })
  }, [conversation])

  // AI prompt
  useEffect(() => {
    const inner = async () => {
      if (!pendingPrompt) return
      if (!assistant) return

      setConversation(prev => [...prev, { role: "user", content: pendingPrompt.prompt, shortContent: pendingPrompt.shortPrompt, isPending: false, id: Date.now() }])
      setConversation(prev => [...prev, { role: "assistant", content: "", isPending: true, id: Date.now() }])

      setPendingPrompt(undefined)

      let id = -1

      for await (const part of assistant.prompt(pendingPrompt.prompt)) {

        if (!part) {
          notifications.show({
            color: 'red',
            title: "'Unexpected Error",
            message: "Empty response"
          })
          setConversation(prev => prev.filter(message => !message.isPending))
          return
        }

        if (!part.success) {
          notifications.show({
            color: 'red',
            title: part.error.friendlyErrorTitle,
            message: part.error.friendlyErrorDescription
          })
          setConversation(prev => prev.filter(message => !message.isPending))
          return
        }

        if (id === -1) {
          id = Date.now()
          setConversation(prev => [
            ...prev.filter(message => !message.isPending),
            {
              role: "assistant",
              content: part.response.content,
              id
            }
          ])
        } else {
          setConversation(prev => prev.map(message => {
            if (message.id !== id) return message
            return {
              ...message,
              content: message.content + part.response.content
            }
          }))
        }
      }
      setInput("")
    }
    inner()
  }
    , [pendingPrompt, assistant])

  return (
    <div className='m-4'>
      <Title order={1} size="md">AI Language Helper</Title>
      <NavLink
        label="Settings"
        leftSection={"⚙️"}
        renderRoot={props => <Link to="settings" {...props} />}
      />
      <Transition
        mounted={conversation.length > 0}
        transition={contextMenuMessage ? undefined : "scale-y"}
        duration={500}
      >
        {
          styles =>
            <div
              ref={scrollableAreaRef}
              className='flex flex-col gap-4 min-h-32 max-h-96 mt-1 overflow-scroll border-2 border-black p-2 rounded'
              style={styles}
            >
              {
                !assistant &&
                <div className='flex justify-center items-center grow'>
                  <Loader />
                </div>
              }
              {
                conversation.map((message) => (
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
                    <Tooltip
                      hidden={!message.shortContent}
                      label={message.shortContent ? message.content : null}
                      multiline
                      w={220}
                    >
                      <Paper
                        withBorder
                        p="xs"
                        bg={message.role === "user" ? "cyan" : ""}
                      >
                        <Markdown>
                          {message.shortContent || message.content}
                        </Markdown>
                        {message.isPending ? <Ellipses /> : null}
                      </Paper>
                    </Tooltip>
                  </div>
                ))
              }
            </div>
        }
      </Transition>
      <form
        onSubmit={e => { e.preventDefault(); getExplanation(input); }}
        className='mt-4'
      >
        <Input
          onChange={e => setInput(e.target.value)}
          value={input}
          placeholder={`Ask something${conversation.length > 0 ? " else" : ""}...`}
          disabled={!assistant}
          autoFocus
          required
        />
        <div className='relative mt-2'>
          <Button disabled={!assistant}>
            Chat
          </Button>
        </div>
      </form>
    </div>
  );
}

export default App;
