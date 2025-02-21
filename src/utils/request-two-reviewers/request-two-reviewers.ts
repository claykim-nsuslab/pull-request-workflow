import * as core from '@actions/core'
import {GitHub} from '@actions/github/lib/utils'

type Parameters = {
  owner: string
  repo: string
  pull_number: number
}

export const requestTwoReviewers = async (
  prAuthor: string,
  approvedReviewers: string[],
  githubUserNames: string[],
  {owner, repo, pull_number}: Parameters,
  octokit: InstanceType<typeof GitHub>
): Promise<string[]> => {
  core.info(`requestTwoReviewers called with parameters: prAuthor=${prAuthor}, approvedReviewers=${approvedReviewers}, githubUserNames=${githubUserNames}, owner=${owner}, repo=${repo}, pull_number=${pull_number}`)
  try {
    const reviewers = githubUserNames.filter(
      user => user !== prAuthor && !approvedReviewers.includes(user)
    )
    core.info(`Filtered reviewers: ${reviewers}`)

    const selectedReviewers = reviewers.slice(0, 2)
    core.info(`Selected reviewers: ${selectedReviewers}`)

    await octokit.rest.pulls.requestReviewers({
      owner,
      repo,
      pull_number,
      reviewers: selectedReviewers
    })
    core.info(`Reviewers requested successfully: ${selectedReviewers}`)

    return selectedReviewers
  } catch (error) {
    core.error(`Error in requestTwoReviewers: ${error}`)
    throw error
  }
}
