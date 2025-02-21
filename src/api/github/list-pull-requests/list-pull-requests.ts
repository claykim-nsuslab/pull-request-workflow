import {GitHub} from '@actions/github/lib/utils'
import {OctokitListPullRequestsResponseType} from '../index'
import * as core from '@actions/core'

export type listPullRequestsParameters = {
  owner: string
  repo: string
  state?: 'open' | 'closed' | 'all' | undefined
}
export const listPullRequests = (octokit: InstanceType<typeof GitHub>) => {
  return async ({owner, repo, ...rest}: listPullRequestsParameters) => {
    core.info(`Listing pull requests with parameters: owner=${owner}, repo=${repo}, state=${rest.state}`)
    try {
      const {data}: OctokitListPullRequestsResponseType =
        await octokit.rest.pulls.list({
          owner,
          repo,
          ...rest
        })
      core.info(`Pull requests listed successfully: ${JSON.stringify(data)}`)
      return data
    } catch (error) {
      core.error(`Error listing pull requests: ${error}`)
      return Promise.reject(error)
    }
  }
}
