import {Message} from '@slack/web-api/dist/response/ConversationsHistoryResponse'
import {Slack} from '../../api/slack'
import * as core from '@actions/core'

export const getPullRequestThread = async ({
  repoName,
  prNumber
}: {
  repoName: string | undefined
  prNumber: number | undefined
}): Promise<Message | undefined> => {
  core.info(`getPullRequestThread called with parameters: repoName=${repoName}, prNumber=${prNumber}`)
  try {
    const history = await Slack.conversationsHistory({
      channel: core.getInput('slack-channel-id')
    })
    core.info(`Slack conversation history retrieved successfully: ${JSON.stringify(history)}`)
    const thread = history.messages?.find(m => m.text === `${repoName}-${prNumber}`)
    core.info(`Pull request thread found: ${JSON.stringify(thread)}`)
    return thread
  } catch (error) {
    core.error(`Error in getPullRequestThread: ${error}`)
    throw error
  }
}
