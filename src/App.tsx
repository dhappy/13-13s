import { Client as Styletron } from 'styletron-engine-atomic'
import { Provider as StyletronProvider } from 'styletron-react'
import { LightTheme, BaseProvider, styled } from 'baseui'
import Lists from './Lists'

const engine = new Styletron()
const Centered = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
})

// eslint-disable-next-line import/no-anonymous-default-export
export default () => (
  <StyletronProvider value={engine}>
    <BaseProvider theme={LightTheme}>
      <Centered>
        <Lists/>
      </Centered>
    </BaseProvider>
  </StyletronProvider>
)