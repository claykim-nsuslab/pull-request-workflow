import {Block, KnownBlock} from '@slack/types'
import {getUserToLog} from '../get-user-to-log'
import * as core from '@actions/core'

export const generatePullRequestChangeRequesterReminderMessage = (
  githubSlackUserMapper: Record<string, string>,
  userToRemind: string,
  html_url: string
): (KnownBlock | Block)[] => {
  core.info(`Generating pull request change requester reminder message with parameters: githubSlackUserMapper=${JSON.stringify(githubSlackUserMapper)}, userToRemind=${userToRemind}, html_url=${html_url}`)
  try {
    const message = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Hi ${getUserToLog(
            githubSlackUserMapper,
            userToRemind
          )} :wave:\nThe <${html_url}|pull request> is waiting for your approval.`
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: ':arrow_right: Review PR',
            emoji: true
          },
          url: `${html_url}/files`,
          action_id: 'button-action'
        }
      }
    ]
    core.info(`Generated pull request change requester reminder message successfully: ${JSON.stringify(message)}`)
    return message
  } catch (error) {
    core.error(`Error generating pull request change requester reminder message: ${error}`)
    throw error
  }
}
