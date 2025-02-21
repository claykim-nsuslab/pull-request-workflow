import {GitHub} from '@actions/github/lib/utils'
import {OctokitListReviewsResponseType} from '../index'
import * as core from '@actions/core'

type Parameters = {
  owner: string
  repo: string
  pull_number: number
}
export const getReviews = (octokit: InstanceType<typeof GitHub>) => {
  return async ({owner, repo, pull_number}: Parameters) => {
    core.info(`Getting reviews with parameters: owner=${owner}, repo=${repo}, pull_number=${pull_number}`)
    try {
      const {data}: OctokitListReviewsResponseType =
        await octokit.rest.pulls.listReviews({
          owner,
          repo,
          pull_number
        })
      core.info(`Reviews retrieved successfully: ${JSON.stringify(data)}`)
      return data
    } catch (error) {
      core.error(`Error getting reviews: ${error}`)
      return Promise.reject(error)
    }
  }
}
