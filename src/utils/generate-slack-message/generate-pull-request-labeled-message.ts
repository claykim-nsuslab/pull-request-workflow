import {Context} from '@actions/github/lib/context'
import {Block, KnownBlock} from '@slack/types'
import {getUserToLog} from '../get-user-to-log'
import * as core from '@actions/core'

export const generatePullRequestLabeledMessage = (
  githubContext: Context,
  githubSlackUserMapper: Record<string, string>
): (KnownBlock | Block)[] => {
  core.info(`Generating pull request labeled message with parameters: githubContext=${JSON.stringify(githubContext)}, githubSlackUserMapper=${JSON.stringify(githubSlackUserMapper)}`)
  try {
    const {label, pull_request} = githubContext.payload
    const message = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `A new label \`${label?.name}\` added to the <${
            pull_request?.html_url
          }|pull request> by ${getUserToLog(
            githubSlackUserMapper,
            githubContext.actor
          )}.`
        }
      }
    ]
    core.info(`Generated pull request labeled message successfully: ${JSON.stringify(message)}`)
    return message
  } catch (error) {
    core.error(`Error generating pull request labeled message: ${error}`)
    throw error
  }
}
