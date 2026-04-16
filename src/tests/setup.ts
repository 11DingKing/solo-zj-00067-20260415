jest.mock('@/dataSources', () => ({
  redis: {
    client: {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn()
    }
  }
}))

jest.mock('@/services', () => ({
  userService: {
    getByEmail: jest.fn(),
    isExistByEmail: jest.fn(),
    create: jest.fn(),
    getById: jest.fn(),
    updatePasswordByUserId: jest.fn(),
    addVerificationToUser: jest.fn(),
    addResetPasswordToUser: jest.fn()
  },
  verificationService: {
    create: jest.fn()
  },
  resetPasswordService: {
    create: jest.fn(),
    getByValidAccessToken: jest.fn(),
    deleteManyByUserId: jest.fn()
  }
}))

jest.mock('@/utils/jwt', () => ({
  jwtSign: jest.fn(() => ({ accessToken: 'mock-jwt-token' })),
  jwtVerify: jest.fn()
}))

jest.mock('@/utils/hash', () => ({
  createHash: jest.fn(password => `hashed-${password}`)
}))

jest.mock('@/utils/cryptoString', () => ({
  createCryptoString: jest.fn(() => 'mock-crypto-string')
}))

jest.mock('@/mailer', () => ({
  UserMail: jest.fn().mockImplementation(() => ({
    signUp: jest.fn(),
    verification: jest.fn(),
    resetPassword: jest.fn(),
    successfullyUpdatedPassword: jest.fn()
  }))
}))

jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  startSession: jest.fn().mockResolvedValue({
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
    inTransaction: jest.fn(() => true)
  })
}))

process.env.JWT_SECRET = 'test-jwt-secret'
process.env.JWT_EXPIRATION = '24h'
process.env.REDIS_TOKEN_EXPIRATION = '86400'
