import { getSymmetricKey } from '../actions/getSymmetricKey.js'
import {
  RENEGADE_AUTH_HEADER_NAME,
  RENEGADE_SIG_EXPIRATION_HEADER_NAME,
} from '../constants.js'
import type { Config } from '../createConfig.js'

/**
 * A lightweight method which resolves when a short-lived websocket connection is closed.
 *
 * The method will open the websocket connection, subscribe to the given topic
 * (sending a subscription message in the format expected by the relayer),
 * and close it when the message handler returns a value, resolving the promise with the value.
 *
 * The message handler should return undefined *only* if the message is not relevant to the waiter.
 * If the message satisfies the waiter's criteria but no return value is needed, the handler
 * should return null.
 *
 * The message handler is also responsible for parsing the message, to give it control over e.g. how
 * bigint values are parsed.
 *
 * Additionally, the method accepts an async `prefetch` function which can be used ahead of the websocket
 * connection being opened to fetch a value which will be returned immediately if it is not undefined.
 *
 * If the timeout is reached, the promise will reject.
 *
 * Because this method is intended for short-lived websocket connections, it does not support reconnecting to the server.
 * If the connection is closed, the method will throw an error.
 */
export async function websocketWaiter<T>(
  config: Config,
  topic: string,
  messageHandler: (message: any) => T | undefined,
  prefetch?: () => Promise<T | undefined>,
  timeout?: number,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let promiseSettled = false

    const ws = new WebSocket(config.getWebsocketBaseUrl())
    ws.onopen = () => {
      const message = buildSubscriptionMessage(config, topic)
      ws.send(JSON.stringify(message))
    }

    ws.onmessage = (event) => {
      try {
        const result = messageHandler(event.data)
        if (result !== undefined) {
          promiseSettled = true
          ws.close()
          resolve(result)
        }
      } catch (error) {
        promiseSettled = true
        ws.close()
        reject(error)
      }
    }

    ws.onclose = () => {
      if (!promiseSettled) {
        promiseSettled = true
        reject(new Error('Websocket connection closed'))
      }
    }

    ws.onerror = (error) => {
      if (!promiseSettled) {
        promiseSettled = true
        reject(error)
      }
    }

    if (timeout) {
      setTimeout(() => {
        if (!promiseSettled) {
          promiseSettled = true
          ws.close()
          reject(new Error('Websocket connection timed out'))
        }
      }, timeout)
    }

    if (prefetch) {
      prefetch().then((result) => {
        if (result) {
          promiseSettled = true
          ws.close()
          resolve(result)
        }
      })
    }
  })
}

function buildSubscriptionMessage(config: Config, topic: string) {
  const body = {
    method: 'subscribe',
    topic,
  }
  const symmetricKey = getSymmetricKey(config)
  const [auth, expiration] = config.utils.build_auth_headers_symmetric(
    symmetricKey,
    JSON.stringify(body),
    BigInt(Date.now()),
  )

  return {
    headers: {
      [RENEGADE_AUTH_HEADER_NAME]: auth,
      [RENEGADE_SIG_EXPIRATION_HEADER_NAME]: expiration,
    },
    body,
  }
}
