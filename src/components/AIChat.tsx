'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Input,
  IconButton,
  VStack,
  Text,
  HStack,
  useToast,
  useColorModeValue,
  Flex,
  Heading,
  Textarea,
  InputGroup,
  InputRightElement,
  Collapse,
  useDisclosure,
  Badge,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { IoSend, IoChevronUp, IoChevronDown } from 'react-icons/io5'
import { RiRobot2Line, RiUser3Line } from 'react-icons/ri'

const MotionBox = motion(Box)
const MotionFlex = motion(Flex)

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const toast = useToast()
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true })

  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const userBubbleBg = useColorModeValue('blue.50', 'blue.900')
  const aiBubbleBg = useColorModeValue('gray.50', 'gray.700')
  const userTextColor = useColorModeValue('gray.800', 'white')
  const aiTextColor = useColorModeValue('gray.800', 'gray.100')
  const iconColor = useColorModeValue('blue.500', 'blue.200')
  const placeholderColor = useColorModeValue('gray.500', 'gray.400')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        sender: 'ai',
      }

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsTyping(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <MotionBox
      w="100%"
      maxW="container.lg"
      mx="auto"
      mt={8}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        borderWidth={1}
        borderRadius="2xl"
        borderColor={borderColor}
        bg={bgColor}
        boxShadow="lg"
        overflow="hidden"
      >
        <Flex
          p={4}
          borderBottomWidth={1}
          borderColor={borderColor}
          justify="space-between"
          align="center"
          cursor="pointer"
          onClick={onToggle}
          _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
        >
          <HStack>
            <RiRobot2Line size="24px" color={iconColor} />
            <Heading size="md">AI Assistant</Heading>
            <Badge colorScheme="blue" variant="subtle">Beta</Badge>
          </HStack>
          {isOpen ? <IoChevronUp /> : <IoChevronDown />}
        </Flex>

        <Collapse in={isOpen} animateOpacity>
          <VStack spacing={0} h={{ base: "400px", md: "500px" }}>
            <Box
              flex={1}
              w="100%"
              overflowY="auto"
              p={4}
              css={{
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: useColorModeValue('gray.100', 'gray.700'),
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: useColorModeValue('gray.300', 'gray.600'),
                  borderRadius: '4px',
                  '&:hover': {
                    background: useColorModeValue('gray.400', 'gray.500'),
                  },
                },
              }}
            >
              <AnimatePresence>
                {messages.map((message) => (
                  <MotionFlex
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    justify={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                    mb={4}
                  >
                    <Flex
                      maxW={{ base: "85%", md: "70%" }}
                      align="flex-start"
                      gap={2}
                    >
                      {message.sender === 'ai' && (
                        <Box mt={1}>
                          <RiRobot2Line size="20px" color={iconColor} />
                        </Box>
                      )}
                      <Box
                        bg={message.sender === 'user' ? userBubbleBg : aiBubbleBg}
                        color={message.sender === 'user' ? userTextColor : aiTextColor}
                        p={3}
                        borderRadius="lg"
                        boxShadow="sm"
                      >
                        <Text fontSize="sm" whiteSpace="pre-wrap">
                          {message.text}
                        </Text>
                      </Box>
                      {message.sender === 'user' && (
                        <Box mt={1}>
                          <RiUser3Line size="20px" color={iconColor} />
                        </Box>
                      )}
                    </Flex>
                  </MotionFlex>
                ))}
                {isTyping && (
                  <MotionFlex
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    align="flex-start"
                    gap={2}
                    mb={4}
                  >
                    <Box mt={1}>
                      <RiRobot2Line size="20px" color={iconColor} />
                    </Box>
                    <Box
                      bg={aiBubbleBg}
                      color={aiTextColor}
                      p={3}
                      borderRadius="lg"
                      boxShadow="sm"
                    >
                      <Text fontSize="sm">●●●</Text>
                    </Box>
                  </MotionFlex>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </Box>

            <Box
              p={4}
              w="100%"
              borderTopWidth={1}
              borderColor={borderColor}
              bg={useColorModeValue('gray.50', 'gray.700')}
            >
              <InputGroup size="lg">
                <Textarea
                  placeholder="Ask about your financial data..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  pr="4.5rem"
                  rows={1}
                  resize="none"
                  bg={bgColor}
                  _placeholder={{ color: placeholderColor }}
                  _focus={{
                    boxShadow: 'none',
                    borderColor: 'blue.500',
                  }}
                />
                <InputRightElement width="4.5rem" h="100%">
                  <IconButton
                    h="1.75rem"
                    size="sm"
                    icon={<IoSend />}
                    colorScheme="blue"
                    isDisabled={!input.trim()}
                    onClick={handleSendMessage}
                    aria-label="Send message"
                  />
                </InputRightElement>
              </InputGroup>
            </Box>
          </VStack>
        </Collapse>
      </Box>
    </MotionBox>
  )
}
