import { TASK_STATUS_ROUTE } from '../constants.js'
import type { Config } from '../createConfig.js'
import { websocketWaiter } from '../utils/websocketWaiter.js'
import { getTaskHistory } from './getTaskHistory.js'
import type { WaitForTaskCompletionParameters } from './waitForTaskCompletion.js'

export async function waitForTaskCompletionWs(
  config: Config,
  parameters: WaitForTaskCompletionParameters,
): Promise<null | undefined> {
  const { id, timeout } = parameters

  const topic = TASK_STATUS_ROUTE(id)

  const prefetch = async () => {
    const taskHistory = await getTaskHistory(config)
    const task = taskHistory.get(id)

    if (task?.state === 'Completed') {
      return null
    }

    if (task?.state === 'Failed') {
      throw new Error(`Task ${id} failed`)
    }

    return undefined
  }

  const messageHandler = (message: any) => {
    const parsedMessage = JSON.parse(message)
    if (
      parsedMessage.topic === topic &&
      parsedMessage.event.type === 'TaskStatusUpdate'
    ) {
      if (parsedMessage.event.status?.state === 'Completed') {
        return null
      }

      if (parsedMessage.event.status?.state === 'Failed') {
        throw new Error(`Task ${id} failed`)
      }
    }

    return undefined
  }

  return websocketWaiter(config, topic, messageHandler, prefetch, timeout)
}
