'use client'

import { Box, Container, VStack } from '@chakra-ui/react'
import ProformaTable from '@/components/ProformaTable'
import AIChat from '@/components/AIChat'

export default function Home() {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8}>
        <ProformaTable />
        <AIChat />
      </VStack>
    </Container>
  )
}
