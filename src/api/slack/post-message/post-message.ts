import {
  ChatPostMessageArguments,
  ChatPostMessageResponse,
  WebClient
} from '@slack/web-api'
import * as core from '@actions/core'

type PostMessage = ({
  channel,
  ...rest
}: ChatPostMessageArguments) => Promise<ChatPostMessageResponse>

export const postMessage = (slackClient: WebClient): PostMessage => {
  return async ({channel, ...rest}) => {
    core.info(`Posting message to Slack channel: ${channel} with parameters: ${JSON.stringify(rest)}`)
    try {
      const response = await slackClient.chat.postMessage({
        channel,
        unfurl_links: false,
        ...rest
      })
      core.info(`Message posted successfully: ${JSON.stringify(response)}`)
      return response
    } catch (error) {
      core.error(`Error posting message to Slack: ${error}`)
      return Promise.reject(error)
    }
  }
}
