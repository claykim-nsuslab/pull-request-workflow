export const getUserToLog = (
  githubSlackUserMapper: Record<string, string>,
  githubUserName: string
): string => {
  try {
    core.info(`getUserToLog called with parameters: githubUserName=${githubUserName}`)
    const result = githubSlackUserMapper[githubUserName]
      ? `<@${githubSlackUserMapper[githubUserName]}>`
      : `*${githubUserName}*`
    core.info(`getUserToLog result: ${result}`)
    return result
  } catch (error) {
    core.error(`Error in getUserToLog: ${error}`)
    throw error
  }
}
