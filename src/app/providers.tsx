'use client'

import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import theme from '../theme'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config?.initialColorMode || 'system'} />
      <ChakraProvider theme={theme}>
        {children}
      </ChakraProvider>
    </>
  )
}
