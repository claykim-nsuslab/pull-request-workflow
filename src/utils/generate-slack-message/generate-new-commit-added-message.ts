import {Context} from '@actions/github/lib/context'
import {Block, KnownBlock} from '@slack/types'
import {getUserToLog} from '../get-user-to-log'
import * as core from '@actions/core'

export const generateNewCommitAddedMessage = (
  githubContext: Context,
  githubSlackUserMapper: Record<string, string>
): (KnownBlock | Block)[] => {
  core.info(`Generating new commit added message with parameters: githubContext=${JSON.stringify(githubContext)}, githubSlackUserMapper=${JSON.stringify(githubSlackUserMapper)}`)
  try {
    const {pull_request} = githubContext.payload
    const message = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `A new <${pull_request?.html_url}/commits/${
            githubContext.payload.after
          }|commit> added to the <${
            pull_request?.html_url
          }|pull request> by ${getUserToLog(
            githubSlackUserMapper,
            githubContext.actor
          )}.`
        }
      }
    ]
    core.info(`Generated new commit added message successfully: ${JSON.stringify(message)}`)
    return message
  } catch (error) {
    core.error(`Error generating new commit added message: ${error}`)
    throw error
  }
}
