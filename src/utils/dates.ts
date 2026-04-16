export const createDateAddDaysFromNow = (days: number) => {
  const date = new Date()

  date.setDate(date.getDate() + days)

  return date
}

export const createDateAddMinutesFromNow = (minutes: number) => {
  const date = new Date()

  date.setMinutes(date.getMinutes() + minutes)

  return date
}

export const createDateNow = () => {
  const date = new Date()

  return date
}
