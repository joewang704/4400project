export const getErrorMessage = (errMsg) => {
  if (!errMsg) {
    return ''
  }
  if (errMsg === 'PW_MATCH') {
    return 'Passwords do not match'
  } else if (errMsg === 'INCORRECT_LOGIN') {
    return 'Username or password is incorrect'
  } else if (errMsg.includes('ER_DUP_ENTRY')) {
    return 'Username or email address is taken'
  }
  return 'Error'
}

export const buildCategoriesQuery = (categories) =>
  categories.map(c => `Category_name = '${c}'`).join(' OR ')

