import * as core from '@actions/core'
import * as github from '@actions/github'
import {Slack} from './api/slack'
import {
  generateNewCommitAddedMessage,
  generatePullRequestCommentAddedMessage,
  generatePullRequestLabeledMessage,
  generatePullRequestMergedMessage,
  generatePullRequestOpenedMessage,
  generatePullRequestReviewRequestedMessage,
  generatePullRequestReviewSubmittedMessage,
  generateReadyToMergeMessage,
  generateSecondReviewerMessage,
  getFileContent,
  getPullRequestReviewStateUsers,
  getPullRequestThread
} from './utils'
import {allowedEventNames, GithubEventNames, ReviewStates} from './constants'
import {pullRequestReminder} from './services'

export const PullRequestWorkflow = async (): Promise<void> => {
  try {
    const {actor, repo, eventName, payload} = github.context
    core.info(`Starting PullRequestWorkflow for event: ${eventName}, action: ${payload.action}`)

    if (!allowedEventNames.includes(eventName as GithubEventNames)) {
      core.warning(
        `eventName should be ${allowedEventNames.join(
          ','
        )} but received: ${eventName} `
      )
      return
    }

    const {githubUserNames, githubSlackUserMapper, remindAfter} =
      await getFileContent()
    core.info(`Loaded configuration: ${JSON.stringify({githubUserNames, githubSlackUserMapper, remindAfter})}`)

    if (eventName === GithubEventNames.SCHEDULE) {
      core.info('Executing pull request reminder')
      await pullRequestReminder(
        {githubUserNames, githubSlackUserMapper, remindAfter},
        {owner: repo.owner, repo: repo.repo}
      )
      core.info('Completed pull request reminder')
    } else {
      if (
        eventName === GithubEventNames.PULL_REQUEST &&
        payload.action === 'opened' &&
        payload.pull_request
      ) {
        core.info('Handling pull request opened event')
        await Slack.postMessage({
          channel: core.getInput('slack-channel-id'),
          text: `${github.context.payload.repository?.name}-${payload.pull_request?.number}`,
          blocks: generatePullRequestOpenedMessage(
            github.context,
            githubSlackUserMapper
          )
        })
        core.info('Completed handling pull request opened event')
      } else {
        const thread = await getPullRequestThread({
          repoName: github.context.payload.repository?.name,
          prNumber:
            github.context.payload.pull_request?.number ||
            github.context.payload.issue?.number
        })
        core.info(`Retrieved Slack thread: ${JSON.stringify(thread)}`)

        if (!thread?.ts) {
          core.warning(
            `The Slack thread is not found for the pull request ${payload.pull_request?.number}. Please revisit your Slack integration here https://github.com/cakarci/pull-request-workflow#create-a-slack-app-with-both-user`
          )
          return
        }

        if (
          eventName === GithubEventNames.PULL_REQUEST &&
          payload.action === 'labeled'
        ) {
          core.info('Handling pull request labeled event')
          await Slack.postMessage({
            channel: core.getInput('slack-channel-id'),
            thread_ts: thread?.ts,
            blocks: generatePullRequestLabeledMessage(
              github.context,
              githubSlackUserMapper
            )
          })
          core.info('Completed handling pull request labeled event')
        }

        if (
          eventName === GithubEventNames.PULL_REQUEST &&
          payload.action === 'closed' &&
          payload.pull_request?.merged
        ) {
          core.info('Handling pull request merged event')
          await Slack.postMessage({
            channel: core.getInput('slack-channel-id'),
            thread_ts: thread?.ts,
            blocks: generatePullRequestMergedMessage(
              github.context,
              githubSlackUserMapper
            )
          })
          core.info('Completed handling pull request merged event')
        }

        if (
          eventName === GithubEventNames.PULL_REQUEST &&
          payload.action === 'synchronize' &&
          payload.pull_request
        ) {
          core.info('Handling pull request synchronize event')
          if (payload.before !== payload.after) {
            await Slack.postMessage({
              channel: core.getInput('slack-channel-id'),
              thread_ts: thread?.ts,
              blocks: generateNewCommitAddedMessage(
                github.context,
                githubSlackUserMapper
              )
            })
          }
          core.info('Completed handling pull request synchronize event')
        }

        if (
          eventName === GithubEventNames.PULL_REQUEST &&
          payload.action === 'review_requested' &&
          payload.pull_request
        ) {
          core.info('Handling pull request review requested event')
          await Slack.postMessage({
            channel: core.getInput('slack-channel-id'),
            text: `${github.context.payload.repository?.name}-${payload.pull_request?.number}`,
            blocks: generatePullRequestOpenedMessage(
              github.context,
              githubSlackUserMapper
            )
          })
          core.info('Completed handling pull request review requested event')
        }

        if (
          eventName === GithubEventNames.ISSUE_COMMENT &&
          payload.action === 'created'
        ) {
          core.info('Handling issue comment created event')
          await Slack.postMessage({
            channel: core.getInput('slack-channel-id'),
            thread_ts: thread?.ts,
            blocks: generatePullRequestCommentAddedMessage(
              github.context,
              githubSlackUserMapper
            )
          })
          core.info('Completed handling issue comment created event')
        }

        if (
          eventName === GithubEventNames.PULL_REQUEST_REVIEW &&
          payload.action === 'submitted' &&
          payload.pull_request
        ) {
          core.info('Handling pull request review submitted event')
          await Slack.postMessage({
            channel: core.getInput('slack-channel-id'),
            thread_ts: thread?.ts,
            blocks: generatePullRequestReviewSubmittedMessage(
              github.context,
              githubSlackUserMapper
            )
          })
          core.info('Completed handling pull request review submitted event')

          const prAuthor = github.context.payload.pull_request?.user.login
          const {APPROVED, CHANGES_REQUESTED, SECOND_APPROVERS, COMMENTED} =
            await getPullRequestReviewStateUsers(
              {
                prAuthor,
                requestedReviewers:
                  payload.pull_request.requested_reviewers.map(
                    (r: {login: never}) => r.login
                  ),
                githubUserNames
              },
              {
                owner: repo.owner,
                repo: repo.repo,
                pull_number: payload.pull_request?.number
              }
            )

          core.info(
            JSON.stringify({
              APPROVED,
              CHANGES_REQUESTED,
              SECOND_APPROVERS,
              COMMENTED
            })
          )

          if (payload.review?.state.toUpperCase() === ReviewStates.APPROVED) {
            if (APPROVED.length === 1) {
              core.info('Notifying second reviewer')
              await Slack.postMessage({
                channel: core.getInput('slack-channel-id'),
                thread_ts: thread?.ts,
                blocks: generateSecondReviewerMessage(
                  github.context,
                  githubSlackUserMapper,
                  'test'
                )
              })
              core.info('Completed notifying second reviewer')
            }

            if (APPROVED.length >= 2 && CHANGES_REQUESTED.length === 0) {
              core.info('Notifying PR author that the PR is ready to merge')
              await Slack.postMessage({
                channel: core.getInput('slack-channel-id'),
                thread_ts: thread?.ts,
                blocks: generateReadyToMergeMessage(
                  github.context,
                  githubSlackUserMapper
                )
              })
              core.info('Completed notifying PR author that the PR is ready to merge')
            }
          }
        }
      }
    }
    core.info('Completed PullRequestWorkflow')
  } catch (error) {
    if (error instanceof Error) {
      core.error(`Error in PullRequestWorkflow: ${error.message}`)
      core.setFailed(error.message)
    }
  }
}
