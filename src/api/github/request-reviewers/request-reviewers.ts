import {GitHub} from '@actions/github/lib/utils'
import * as core from '@actions/core'

type Parameters = {
  owner: string
  repo: string
  pull_number: number
  reviewers: string[] | undefined
}
export const requestReviewers = (octokit: InstanceType<typeof GitHub>) => {
  return async ({owner, repo, pull_number, reviewers}: Parameters) => {
    core.info(`Requesting reviewers with parameters: owner=${owner}, repo=${repo}, pull_number=${pull_number}, reviewers=${reviewers}`)
    try {
      const response = await octokit.rest.pulls.requestReviewers({
        owner,
        repo,
        pull_number,
        reviewers
      })
      core.info(`Reviewers requested successfully: ${JSON.stringify(response.data)}`)
      return response
    } catch (error) {
      core.error(`Error requesting reviewers: ${error}`)
      return Promise.reject(error)
    }
  }
}
