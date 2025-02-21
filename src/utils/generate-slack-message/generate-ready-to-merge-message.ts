import {Context} from '@actions/github/lib/context'
import {Block, KnownBlock} from '@slack/types'
import {generateGreetingMessage} from './partial-messages'
import * as core from '@actions/core'

export const generateReadyToMergeMessage = (
  githubContext: Context,
  githubSlackUserMapper: Record<string, string>
): (KnownBlock | Block)[] => {
  core.info(`Generating ready to merge message with parameters: githubContext=${JSON.stringify(githubContext)}, githubSlackUserMapper=${JSON.stringify(githubSlackUserMapper)}`)
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
          )}Your <${
            pull_request?.html_url
          }|pull request>  ready to be merged :rocket:`
        }
      }
    ]
    core.info(`Generated ready to merge message successfully: ${JSON.stringify(message)}`)
    return message
  } catch (error) {
    core.error(`Error generating ready to merge message: ${error}`)
    throw error
  }
}
