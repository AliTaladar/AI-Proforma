import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
}

const theme = extendTheme({ 
  config,
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'white',
      },
    }),
  },
  components: {
    Table: {
      variants: {
        simple: (props: any) => ({
          th: {
            borderColor: props.colorMode === 'dark' ? 'whiteAlpha.300' : 'gray.200',
            color: props.colorMode === 'dark' ? 'whiteAlpha.900' : 'gray.600',
          },
          td: {
            borderColor: props.colorMode === 'dark' ? 'whiteAlpha.300' : 'gray.200',
          },
        }),
      },
    },
    Input: {
      variants: {
        outline: (props: any) => ({
          field: {
            _placeholder: {
              color: props.colorMode === 'dark' ? 'whiteAlpha.400' : 'gray.400',
            },
          },
        }),
      },
    },
  },
})

export default theme
