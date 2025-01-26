'use client'

import { useState } from 'react'
import {
  Box,
  Input,
  Button,
  VStack,
  Text,
  HStack,
  useToast,
} from '@chakra-ui/react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const toast = useToast()

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')

    // TODO: Implement AI response logic here
    // For now, we'll just show a placeholder response
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: "I'm analyzing your financial data. This feature will be implemented soon.",
      sender: 'ai',
    }

    setTimeout(() => {
      setMessages(prev => [...prev, aiMessage])
    }, 1000)
  }

  return (
    <Box w="100%" maxW="container.lg" borderWidth={1} borderRadius="lg" p={4}>
      <VStack spacing={4} align="stretch" h="400px">
        <Box flex={1} overflowY="auto" p={2}>
          {messages.map((message) => (
            <Box
              key={message.id}
              bg={message.sender === 'user' ? 'blue.50' : 'gray.50'}
              p={2}
              borderRadius="md"
              mb={2}
              ml={message.sender === 'user' ? 'auto' : 0}
              mr={message.sender === 'ai' ? 'auto' : 0}
              maxW="80%"
            >
              <Text>{message.text}</Text>
            </Box>
          ))}
        </Box>
        
        <HStack>
          <Input
            placeholder="Ask about your financial data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage()
              }
            }}
          />
          <Button colorScheme="blue" onClick={handleSendMessage}>
            Send
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
}
