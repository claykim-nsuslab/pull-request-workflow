import {Context} from '@actions/github/lib/context'
import {Block, KnownBlock} from '@slack/types'
import {getUserToLog} from '../get-user-to-log'
import {generateGreetingMessage} from './partial-messages'
import * as core from '@actions/core'

export const generatePullRequestCommentAddedMessage = (
  githubContext: Context,
  githubSlackUserMapper: Record<string, string>
): (KnownBlock | Block)[] => {
  core.info('Generating pull request comment added message')
  core.info(`Input parameters: ${JSON.stringify({githubContext, githubSlackUserMapper})}`)
  try {
    const {comment} = githubContext.payload
    const message = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${generateGreetingMessage(
            githubContext,
            githubSlackUserMapper
          )}A new <${comment?.html_url}|comment> added by ${getUserToLog(
            githubSlackUserMapper,
            githubContext.actor
          )}`
        }
      }
    ]
    core.info(`Generated message: ${JSON.stringify(message)}`)
    return message
  } catch (error) {
    core.error(`Error generating pull request comment added message: ${error}`)
    throw error
  }
}
