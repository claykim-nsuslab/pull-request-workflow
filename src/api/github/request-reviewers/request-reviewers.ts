import {GitHub} from '@actions/github/lib/utils'

type Parameters = {
  owner: string
  repo: string
  pull_number: number
  reviewers: string[] | undefined
}

export const requestReviewers = (octokit: InstanceType<typeof GitHub>) => {
  return async ({owner, repo, pull_number, reviewers}: Parameters) => {
    try {
      const collaborators = await octokit.rest.repos.listCollaborators({
        owner,
        repo
      })

      const collaboratorLogins = collaborators.data.map(
        (collaborator: {login: string}) => collaborator.login
      )

      const validReviewers = reviewers?.filter(reviewer =>
        collaboratorLogins.includes(reviewer)
      )

      if (validReviewers?.length === 0) {
        console.warn(
          'None of the specified reviewers are collaborators of the repository.'
        )
        return
      }

      if (validReviewers?.length !== reviewers?.length) {
        console.warn(
          'Some of the specified reviewers are not collaborators and will be skipped.'
        )
      }

      return await octokit.rest.pulls.requestReviewers({
        owner,
        repo,
        pull_number,
        reviewers: validReviewers
      })
    } catch (error) {
      return Promise.reject(error)
    }
  }
}
