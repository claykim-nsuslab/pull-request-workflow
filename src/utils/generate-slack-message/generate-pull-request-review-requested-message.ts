import {Context} from '@actions/github/lib/context'
import {Block, KnownBlock} from '@slack/types'
import {getUserToLog} from '../get-user-to-log'
import {generateGreetingMessage} from './partial-messages'
import * as core from '@actions/core'

export const generatePullRequestReviewRequestedMessage = (
  githubContext: Context,
  githubSlackUserMapper: Record<string, string>
): (KnownBlock | Block)[] => {
  core.info(`Generating pull request review requested message with parameters: githubContext=${JSON.stringify(githubContext)}, githubSlackUserMapper=${JSON.stringify(githubSlackUserMapper)}`)
  try {
    const {pull_request} = githubContext.payload
    const message = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${generateGreetingMessage(
            githubContext,
            githubSlackUserMapper
          )}A new review was requested from you for the <${
            pull_request?.html_url
          }|pull request> by ${getUserToLog(
            githubSlackUserMapper,
            githubContext.actor
          )}.`
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '_Happy code reviews_ :tada:'
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: ':arrow_right: Review PR',
            emoji: true
          },
          url: `${pull_request?.html_url}/files`,
          action_id: 'button-action'
        }
      }
    ]
    core.info(`Generated pull request review requested message successfully: ${JSON.stringify(message)}`)
    return message
  } catch (error) {
    core.error(`Error generating pull request review requested message: ${error}`)
    throw error
  }
}
