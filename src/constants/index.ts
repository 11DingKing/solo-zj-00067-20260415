export enum ExpiresInDays {
  Verification = 7
}

export enum ExpiresInMinutes {
  ResetPassword = 30
}

export enum ExpiresInSeconds {
  ResetPasswordRateLimit = 3600,
  UsedResetToken = 1800
}

export enum RedisKeyPrefix {
  UsedResetToken = 'usedResetToken:',
  ResetPasswordRateLimit = 'resetPasswordRateLimit:'
}

export enum Mimetype {
  Jpeg = 'image/jpeg',
  Png = 'image/png'
}

export enum ImageSizeInMb {
  Ten = 10
}

export enum MediaRefType {
  User = 'User'
}
