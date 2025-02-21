import {Block, KnownBlock} from '@slack/types'
import {getUserToLog} from '../get-user-to-log'
import * as core from '@actions/core'

export const generatePullRequestAuthorReminderMessage = (
  githubSlackUserMapper: Record<string, string>,
  userToRemind: string,
  html_url: string
): (KnownBlock | Block)[] => {
  core.info(`Generating pull request author reminder message with parameters: githubSlackUserMapper=${JSON.stringify(githubSlackUserMapper)}, userToRemind=${userToRemind}, html_url=${html_url}`)
  try {
    const message = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Hi ${getUserToLog(
            githubSlackUserMapper,
            userToRemind
          )} :wave:\nThe <${html_url}|pull request> is ready to be merged and waiting your action.`
        }
      }
    ]
    core.info(`Generated pull request author reminder message successfully: ${JSON.stringify(message)}`)
    return message
  } catch (error) {
    core.error(`Error generating pull request author reminder message: ${error}`)
    throw error
  }
}
