import {Context} from '@actions/github/lib/context'
import {Block, KnownBlock} from '@slack/types'
import {getUserToLog} from '../get-user-to-log'
import * as core from '@actions/core'

export const generatePullRequestMergedMessage = (
  githubContext: Context,
  githubSlackUserMapper: Record<string, string>
): (KnownBlock | Block)[] => {
  core.info(`Generating pull request merged message with parameters: githubContext=${JSON.stringify(githubContext)}, githubSlackUserMapper=${JSON.stringify(githubSlackUserMapper)}`)
  try {
    const {pull_request} = githubContext.payload
    const message = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `The <${
            pull_request?.html_url
          }|pull request> is merged by ${getUserToLog(
            githubSlackUserMapper,
            githubContext.actor
          )}.`
        }
      }
    ]
    core.info(`Generated pull request merged message successfully: ${JSON.stringify(message)}`)
    return message
  } catch (error) {
    core.error(`Error generating pull request merged message: ${error}`)
    throw error
  }
}
