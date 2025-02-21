import {
  ConversationsHistoryArguments,
  ConversationsHistoryResponse,
  WebClient
} from '@slack/web-api'
import * as core from '@actions/core'

type SearchMessages = ({
  ...args
}: ConversationsHistoryArguments) => Promise<ConversationsHistoryResponse>

export const conversationsHistory = (
  slackClient: WebClient
): SearchMessages => {
  return async ({...args}) => {
    core.info(`Fetching conversation history with parameters: ${JSON.stringify(args)}`)
    try {
      const response = await slackClient.conversations.history({
        ...args
      })
      core.info(`Conversation history fetched successfully: ${JSON.stringify(response)}`)
      return response
    } catch (error) {
      core.error(`Error fetching conversation history: ${error}`)
      return Promise.reject(error)
    }
  }
}
