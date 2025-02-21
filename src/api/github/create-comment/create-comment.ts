import {GitHub} from '@actions/github/lib/utils'
import * as core from '@actions/core'

type Parameters = {
  owner: string
  repo: string
  issue_number: number
  body: string
}
export const createComment = (octokit: InstanceType<typeof GitHub>) => {
  return async ({owner, repo, issue_number, body}: Parameters) => {
    core.info(`Creating comment with parameters: owner=${owner}, repo=${repo}, issue_number=${issue_number}, body=${body}`)
    try {
      const response = await octokit.rest.issues.createComment({
        issue_number,
        owner,
        repo,
        body
      })
      core.info(`Comment created successfully: ${JSON.stringify(response.data)}`)
      return response
    } catch (error) {
      core.error(`Error creating comment: ${error}`)
      return Promise.reject(error)
    }
  }
}
