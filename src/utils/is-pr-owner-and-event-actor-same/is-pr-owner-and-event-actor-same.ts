import {Context} from '@actions/github/lib/context'
import * as core from '@actions/core'

export const isPrOwnerAndEventActorSame = (githubContext: Context): Boolean => {
  core.info(`isPrOwnerAndEventActorSame called with parameters: githubContext=${JSON.stringify(githubContext)}`)
  try {
    const {pull_request, issue} = githubContext.payload
    const owner = pull_request?.user.login || issue?.user.login
    const result = owner === githubContext.actor
    core.info(`isPrOwnerAndEventActorSame result: ${result}`)
    return result
  } catch (error) {
    core.error(`Error in isPrOwnerAndEventActorSame: ${error}`)
    throw error
  }
}
