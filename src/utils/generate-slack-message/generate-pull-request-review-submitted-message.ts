import {Context} from '@actions/github/lib/context'
import {Block, KnownBlock} from '@slack/types'
import {getUserToLog} from '../get-user-to-log'
import {generateGreetingMessage} from './partial-messages'
import {ReviewStates} from '../../constants'
import * as core from '@actions/core'

export const generatePullRequestReviewSubmittedMessage = (
  githubContext: Context,
  githubSlackUserMapper: Record<string, string>
): (KnownBlock | Block)[] => {
  core.info(`Generating pull request review submitted message with parameters: githubContext=${JSON.stringify(githubContext)}, githubSlackUserMapper=${JSON.stringify(githubSlackUserMapper)}`)
  try {
    const {review} = githubContext.payload
    const reviewState = (review?.state).toUpperCase()
    const message = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${generateGreetingMessage(
            githubContext,
            githubSlackUserMapper
          )}A new <${review?.html_url}|review comment> added by ${getUserToLog(
            githubSlackUserMapper,
            githubContext.actor
          )}`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*Review State:* ${reviewState.replace('_', ' ')} ${
              reviewState === ReviewStates.APPROVED
                ? ':large_green_circle:'
                : reviewState === ReviewStates.CHANGES_REQUESTED
                ? ':red_circle:'
                : ':page_with_curl:'
            }`
          }
        ]
      }
    ]
    core.info(`Generated pull request review submitted message successfully: ${JSON.stringify(message)}`)
    return message
  } catch (error) {
    core.error(`Error generating pull request review submitted message: ${error}`)
    throw error
  }
}
