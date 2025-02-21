import {Context} from '@actions/github/lib/context'
import {Block, KnownBlock} from '@slack/types'
import {getUserToLog} from '../get-user-to-log'
import * as core from '@actions/core'

export const generatePullRequestOpenedMessage = (
  githubContext: Context,
  githubSlackUserMapper: Record<string, string>
): (KnownBlock | Block)[] => {
  core.info(`Generating pull request opened message with parameters: githubContext=${JSON.stringify(githubContext)}, githubSlackUserMapper=${JSON.stringify(githubSlackUserMapper)}`)
  try {
    const {pull_request, repository} = githubContext.payload
    const date = new Date(pull_request?.created_at).toLocaleDateString('de-DE', {
      timeZone: 'Europe/Berlin'
    })
    const time = new Date(pull_request?.created_at).toLocaleTimeString('de-DE', {
      timeZone: 'Europe/Berlin'
    })
    const pullRequestTitle = `<${pull_request?.html_url}|${pull_request?.title}>`
    const reviewers = pull_request?.requested_reviewers?.map((reviewer: {login: string}) => getUserToLog(githubSlackUserMapper, reviewer.login)).join(', ')
    const message = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:boom: *New Pull Request ${pullRequestTitle} is submitted*`
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':hourglass_flowing_sand: It is time to add your reviews'
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
      },
      {
        type: 'divider'
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*PR Author:* ${getUserToLog(
              githubSlackUserMapper,
              githubContext.actor
            )} \n*Repository:* <${repository?.html_url}|${
              repository?.name
            }> \n*Created At:* ${date} | ${time} \n*Reviewers:* ${reviewers}`
          }
        ]
      }
    ]
    core.info(`Generated pull request opened message successfully: ${JSON.stringify(message)}`)
    return message
  } catch (error) {
    core.error(`Error generating pull request opened message: ${error}`)
    throw error
  }
}
