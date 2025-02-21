import {githubService, OctokitListReviewsResponseType} from '../../api/github'
import {ReviewStates} from '../../constants'
import {requestTwoReviewers} from '../request-two-reviewers'
import * as core from '@actions/core'

type UserWithState = {user: string; state: ReviewStates}

interface ReviewStateUsersMap {
  [ReviewStates.APPROVED]: string[]
  [ReviewStates.CHANGES_REQUESTED]: string[]
  [ReviewStates.COMMENTED]: string[]
}

export const getPullRequestReviewStateUsers = async (
  {
    prAuthor,
    requestedReviewers,
    githubUserNames
  }: {
    prAuthor: string
    requestedReviewers: string[]
    githubUserNames: string[]
  },
  {owner, repo, pull_number}: {owner: string; repo: string; pull_number: number}
): Promise<ReviewStateUsersMap & {SECOND_APPROVERS: string[]}> => {
  core.info(`getPullRequestReviewStateUsers called with parameters: prAuthor=${prAuthor}, requestedReviewers=${requestedReviewers}, githubUserNames=${githubUserNames}, owner=${owner}, repo=${repo}, pull_number=${pull_number}`)
  try {
    const reviews = await githubService.getReviews({
      owner,
      repo,
      pull_number
    })
    core.info(`Reviews retrieved successfully: ${JSON.stringify(reviews)}`)

    const reviewersWithState = getReviewers(reviews)
    const {APPROVED, CHANGES_REQUESTED, COMMENTED} = getReviewStateUsersMap(
      reviewersWithState,
      prAuthor
    )

    let SECOND_APPROVERS = [
      ...new Set([...requestedReviewers, ...COMMENTED, ...CHANGES_REQUESTED])
    ]

    if (SECOND_APPROVERS.length === 0) {
      SECOND_APPROVERS = await requestTwoReviewers(
        [prAuthor, ...APPROVED, ...CHANGES_REQUESTED],
        githubUserNames,
        {
          owner,
          repo,
          pull_number
        }
      )
    }

    core.info(`getPullRequestReviewStateUsers result: ${JSON.stringify({SECOND_APPROVERS, APPROVED, CHANGES_REQUESTED, COMMENTED})}`)
    return {
      SECOND_APPROVERS,
      APPROVED,
      CHANGES_REQUESTED,
      COMMENTED
    }
  } catch (error) {
    core.error(`Error in getPullRequestReviewStateUsers: ${error}`)
    throw error
  }
}

const getReviewers = (
  reviews: OctokitListReviewsResponseType['data']
): UserWithState[] => {
  core.info(`getReviewers called with reviews: ${JSON.stringify(reviews)}`)
  const result = reviews.map(r => ({
    user: r?.user?.login as string,
    state: r.state as ReviewStates
  }))
  core.info(`getReviewers result: ${JSON.stringify(result)}`)
  return result
}

const getReviewStateUsersMap = (
  reviews: UserWithState[],
  prAuthor: string
): ReviewStateUsersMap => {
  core.info(`getReviewStateUsersMap called with reviews: ${JSON.stringify(reviews)}, prAuthor: ${prAuthor}`)
  const getLatestReviewOfUser = (user: string): UserWithState | undefined =>
    reviews
      .filter(r => r.state !== ReviewStates.COMMENTED)
      .filter(r => r.user === user)
      .pop()

  const isUserOnlyCommented = (user: string): boolean =>
    reviews
      .filter(r => r.user === user)
      .every(r => r.state === ReviewStates.COMMENTED)

  const reducer = (
    acc: ReviewStateUsersMap,
    review: UserWithState
  ): ReviewStateUsersMap => {
    if (isUserOnlyCommented(review.user)) {
      !acc[ReviewStates.COMMENTED].includes(review.user) &&
        review.user !== prAuthor &&
        acc[ReviewStates.COMMENTED].push(review.user)
    }
    const latestReview = getLatestReviewOfUser(review.user)
    if (latestReview?.state) {
      !acc[latestReview.state].includes(review.user) &&
        acc[latestReview.state].push(review.user)
    }
    return acc
  }

  const result = reviews.reduce(reducer, {
    [ReviewStates.APPROVED]: [],
    [ReviewStates.CHANGES_REQUESTED]: [],
    [ReviewStates.COMMENTED]: []
  })
  core.info(`getReviewStateUsersMap result: ${JSON.stringify(result)}`)
  return result
}
