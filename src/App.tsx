import React from 'react'
import { ChakraProvider, Flex } from '@chakra-ui/react'
import Lists from './Lists'

// eslint-disable-next-line import/no-anonymous-default-export
export default () => (
  <ChakraProvider>
    <Flex justify="center">
      <Lists/>
    </Flex>
  </ChakraProvider>
)