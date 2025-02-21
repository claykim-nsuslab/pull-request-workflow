import {readFile} from 'fs/promises'
import * as core from '@actions/core'

interface PullRequestWorkflowInterface {
  teamName?: string
  githubUserNames: string[]
  githubSlackUserMapper: Record<string, string>
  remindAfter?: number
}
export const getFileContent =
  async (): Promise<PullRequestWorkflowInterface> => {
    core.info('Starting getFileContent function')
    try {
      const data = JSON.parse(
        await readFile('./.github/pull-request-workflow.json', 'utf8')
      )
      core.info(`File content read successfully: ${JSON.stringify(data)}`)
      validateData(data)
      core.info('File content validated successfully')
      return data
    } catch (err) {
      core.error(`Error in getFileContent function: ${err}`)
      return await Promise.reject(err)
    }
  }

const validateData = ({
  remindAfter,
  githubUserNames,
  githubSlackUserMapper
}: PullRequestWorkflowInterface): void => {
  if (remindAfter && typeof remindAfter !== 'number') {
    throw new Error(`"remindAfter" should be a number`)
  }

  if (remindAfter && remindAfter <= 0) {
    throw new Error(`"remindAfter" should be greater than 0`)
  }

  if (
    (githubUserNames && !Array.isArray(githubUserNames)) ||
    !githubUserNames ||
    githubUserNames?.length === 0
  ) {
    throw new Error(
      `"githubUserNames" should be defined as ["githubUserName1", "githubUserName2", "githubUserName3"]`
    )
  }
  if (
    (githubSlackUserMapper && !isObject(githubSlackUserMapper)) ||
    !githubSlackUserMapper ||
    Object.keys(githubSlackUserMapper)?.length === 0
  ) {
    throw new Error(
      `"githubSlackUserMapper" should be defined as {"githubUserName1":"slackMemberId1", "githubUserName2":"slackMemberId2", "githubUserName3":"slackMemberId3"}`
    )
  }
}

const isObject = (item: unknown): boolean => {
  return typeof item === 'object' && !Array.isArray(item) && item !== null
}
