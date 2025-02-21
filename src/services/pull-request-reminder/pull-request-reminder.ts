import {listPullRequestsParameters} from '../../api/github/list-pull-requests'
import {
  githubService,
  OctokitListPullRequestsResponseType
} from '../../api/github'
import {
  generatePullRequestAuthorReminderMessage,
  generatePullRequestChangeRequesterReminderMessage,
  generatePullRequestReviewerReminderMessage,
  getPullRequestReviewStateUsers,
  getPullRequestThread
} from '../../utils'
import {Slack} from '../../api/slack'
import * as core from '@actions/core'

interface PullRequestReminderParameters {
  githubUserNames: string[]
  githubSlackUserMapper: Record<string, string>
  remindAfter: number | undefined
}

/**
 * Send reminders for pull requests.
 */
export const pullRequestReminder = async (
  {
    githubUserNames,
    githubSlackUserMapper,
    remindAfter
  }: PullRequestReminderParameters,
  {owner, repo, state = 'open'}: listPullRequestsParameters
): Promise<void> => {
  core.info('Starting pullRequestReminder function')
  core.info(`Input parameters: ${JSON.stringify({githubUserNames, githubSlackUserMapper, remindAfter, owner, repo, state})}`)

  if (!remindAfter) {
    // No need to send reminders if remindAfter is not defined.
    core.info('No reminders to send as remindAfter is not defined')
    return
  }

  const pulls: OctokitListPullRequestsResponseType['data'] =
    await githubService.listPullRequests({owner, repo, state})
  core.info(`Retrieved pull requests: ${JSON.stringify(pulls)}`)

  if (pulls.length === 0) {
    // No pull requests to remind about.
    core.info('No pull requests to remind about')
    return
  }

  for (const pullRequest of pulls) {
    await processPullRequest(
      pullRequest,
      remindAfter,
      githubUserNames,
      githubSlackUserMapper,
      owner,
      repo
    )
  }
  core.info('Completed pullRequestReminder function')
}

/**
 * Check if it's time to send a reminder for a pull request.
 */
const isTimeToRemind = (updatedAt: string, remindAfter: number): boolean => {
  const currentTime = new Date().getTime()
  const updatedAtTime = new Date(updatedAt).getTime()
  const remindThreshold = 3600000 * remindAfter // Convert hours to milliseconds.
  const result = currentTime - remindThreshold > updatedAtTime
  core.info(`isTimeToRemind: ${result} (currentTime: ${currentTime}, updatedAtTime: ${updatedAtTime}, remindThreshold: ${remindThreshold})`)
  return result
}

/**
 * Process an individual pull request and send reminders if necessary.
 */
const processPullRequest = async (
  pullRequest: OctokitListPullRequestsResponseType['data'][number],
  remindAfter: number,
  githubUserNames: string[],
  githubSlackUserMapper: Record<string, string>,
  owner: string,
  repo: string
): Promise<void> => {
  core.info('Starting processPullRequest function')
  core.info(`Input parameters: ${JSON.stringify({pullRequest, remindAfter, githubUserNames, githubSlackUserMapper, owner, repo})}`)

  const {number, updated_at, requested_reviewers, user, html_url} = pullRequest

  if (isTimeToRemind(updated_at, remindAfter)) {
    const thread = await getPullRequestThread({
      repoName: repo,
      prNumber: number
    })
    core.info(`Retrieved Slack thread: ${JSON.stringify(thread)}`)

    if (!thread?.ts) {
      // Skip if there's no thread timestamp.
      core.info('No thread timestamp found, skipping reminder')
      return
    }

    const reviewStateUsers = await getPullRequestReviewStateUsers(
      {
        prAuthor: user?.login as string,
        requestedReviewers: requested_reviewers?.map(
          (r: {login: string}) => r.login
        ) as string[],
        githubUserNames
      },
      {
        owner,
        repo,
        pull_number: number
      }
    )
    core.info(`Retrieved review state users: ${JSON.stringify(reviewStateUsers)}`)

    sendAuthorReminderIfApplicable(
      reviewStateUsers.APPROVED.length,
      reviewStateUsers.CHANGES_REQUESTED.length,
      html_url,
      thread.ts,
      user?.login as string,
      githubSlackUserMapper
    )

    sendReviewerRemindersIfApplicable(
      reviewStateUsers.APPROVED.length,
      reviewStateUsers.SECOND_APPROVERS,
      html_url,
      thread.ts,
      githubSlackUserMapper
    )

    sendChangeRequesterRemindersIfApplicable(
      reviewStateUsers.APPROVED.length,
      reviewStateUsers.CHANGES_REQUESTED,
      html_url,
      thread.ts,
      githubSlackUserMapper
    )
  }
  core.info('Completed processPullRequest function')
}

/**
 * Send a reminder message to the author of the pull request if applicable.
 */
const sendAuthorReminderIfApplicable = (
  approvedCount: number,
  changesRequestedCount: number,
  htmlUrl: string,
  threadTs: string,
  authorLogin: string,
  slackUserMapper: Record<string, string>
): void => {
  core.info('Starting sendAuthorReminderIfApplicable function')
  core.info(`Input parameters: ${JSON.stringify({approvedCount, changesRequestedCount, htmlUrl, threadTs, authorLogin, slackUserMapper})}`)

  if (approvedCount === 2 && changesRequestedCount === 0) {
    Slack.postMessage({
      channel: core.getInput('slack-channel-id'),
      thread_ts: threadTs,
      blocks: generatePullRequestAuthorReminderMessage(
        slackUserMapper,
        authorLogin,
        htmlUrl
      )
    })
  }
  core.info('Completed sendAuthorReminderIfApplicable function')
}

/**
 * Send reminders to additional reviewers if applicable.
 */
const sendReviewerRemindersIfApplicable = (
  approvedCount: number,
  secondApprovers: string[],
  htmlUrl: string,
  threadTs: string,
  slackUserMapper: Record<string, string>
): void => {
  core.info('Starting sendReviewerRemindersIfApplicable function')
  core.info(`Input parameters: ${JSON.stringify({approvedCount, secondApprovers, htmlUrl, threadTs, slackUserMapper})}`)

  if (approvedCount <= 1 && secondApprovers.length !== 0) {
    for (const secondApprover of secondApprovers) {
      Slack.postMessage({
        channel: core.getInput('slack-channel-id'),
        thread_ts: threadTs,
        blocks: generatePullRequestReviewerReminderMessage(
          slackUserMapper,
          secondApprover,
          htmlUrl
        )
      })
    }
  }
  core.info('Completed sendReviewerRemindersIfApplicable function')
}

/**
 * Send reminders to change requesters if applicable.
 */
const sendChangeRequesterRemindersIfApplicable = (
  approvedCount: number,
  changesRequesters: string[],
  htmlUrl: string,
  threadTs: string,
  slackUserMapper: Record<string, string>
): void => {
  core.info('Starting sendChangeRequesterRemindersIfApplicable function')
  core.info(`Input parameters: ${JSON.stringify({approvedCount, changesRequesters, htmlUrl, threadTs, slackUserMapper})}`)

  if (approvedCount === 2 && changesRequesters.length !== 0) {
    for (const changesRequester of changesRequesters) {
      Slack.postMessage({
        channel: core.getInput('slack-channel-id'),
        thread_ts: threadTs,
        blocks: generatePullRequestChangeRequesterReminderMessage(
          slackUserMapper,
          changesRequester,
          htmlUrl
        )
      })
    }
  }
  core.info('Completed sendChangeRequesterRemindersIfApplicable function')
}
