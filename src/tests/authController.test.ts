import { Response } from 'express'
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import { ObjectId } from 'mongoose'

import { authController } from '@/controllers/authController'
import {
  userService,
  resetPasswordService,
  verificationService
} from '@/services'
import { redis } from '@/dataSources'
import {
  IBodyRequest,
  ICombinedRequest,
  IContextRequest,
  IUserRequest
} from '@/contracts/request'
import { ExpiresInSeconds, RedisKeyPrefix } from '@/constants'

jest.mock('@/services')
jest.mock('@/dataSources')

const mockUserId = new ObjectId('507f1f77bcf86cd799439011') as unknown as ObjectId

const createMockUser = (overrides = {}) => ({
  id: mockUserId,
  _id: mockUserId,
  email: 'test@example.com',
  password: 'hashedPassword',
  verified: false,
  comparePassword: jest.fn().mockReturnValue(true),
  toJSON: jest.fn(),
  save: jest.fn(),
  ...overrides
})

describe('authController', () => {
  let mockResponse: Partial<Response>
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jsonMock = jest.fn()
    statusMock = jest.fn().mockReturnThis()
    mockResponse = {
      status: statusMock,
      json: jsonMock
    } as Partial<Response>
  })

  describe('signIn', () => {
    it('should sign in successfully with valid credentials', async () => {
      const mockUser = createMockUser()
      ;(userService.getByEmail as jest.Mock).mockResolvedValue(mockUser)

      const mockRequest: Partial<IBodyRequest<any>> = {
        body: {
          email: 'test@example.com',
          password: 'ValidPass123'
        }
      }

      await authController.signIn(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response
      )

      expect(userService.getByEmail).toHaveBeenCalledWith('test@example.com')
      expect(mockUser.comparePassword).toHaveBeenCalledWith('ValidPass123')
      expect(statusMock).toHaveBeenCalledWith(StatusCodes.OK)
      expect(jsonMock).toHaveBeenCalledWith({
        data: { accessToken: 'mock-jwt-token' },
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    })

    it('should return NOT_FOUND when user does not exist', async () => {
      ;(userService.getByEmail as jest.Mock).mockResolvedValue(null)

      const mockRequest: Partial<IBodyRequest<any>> = {
        body: {
          email: 'nonexistent@example.com',
          password: 'anyPassword'
        }
      }

      await authController.signIn(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response
      )

      expect(statusMock).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(jsonMock).toHaveBeenCalledWith({
        message: ReasonPhrases.NOT_FOUND,
        status: StatusCodes.NOT_FOUND
      })
    })

    it('should return NOT_FOUND when password is incorrect', async () => {
      const mockUser = createMockUser()
      mockUser.comparePassword = jest.fn().mockReturnValue(false)
      ;(userService.getByEmail as jest.Mock).mockResolvedValue(mockUser)

      const mockRequest: Partial<IBodyRequest<any>> = {
        body: {
          email: 'test@example.com',
          password: 'WrongPass123'
        }
      }

      await authController.signIn(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response
      )

      expect(statusMock).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
    })
  })

  describe('signUp', () => {
    it('should sign up successfully with valid data', async () => {
      ;(userService.isExistByEmail as jest.Mock).mockResolvedValue(false)
      ;(userService.create as jest.Mock).mockResolvedValue(createMockUser())
      ;(verificationService.create as jest.Mock).mockResolvedValue({
        id: new ObjectId()
      })

      const mockRequest: Partial<IBodyRequest<any>> = {
        body: {
          email: 'newuser@example.com',
          password: 'StrongPass123'
        }
      }

      await authController.signUp(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response
      )

      expect(userService.isExistByEmail).toHaveBeenCalledWith('newuser@example.com')
      expect(userService.create).toHaveBeenCalled()
      expect(verificationService.create).toHaveBeenCalled()
      expect(statusMock).toHaveBeenCalledWith(StatusCodes.OK)
      expect(jsonMock).toHaveBeenCalledWith({
        data: { accessToken: 'mock-jwt-token' },
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    })

    it('should return CONFLICT when email already exists', async () => {
      ;(userService.isExistByEmail as jest.Mock).mockResolvedValue(true)

      const mockRequest: Partial<IBodyRequest<any>> = {
        body: {
          email: 'existing@example.com',
          password: 'StrongPass123'
        }
      }

      await authController.signUp(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response
      )

      expect(statusMock).toHaveBeenCalledWith(StatusCodes.CONFLICT)
      expect(jsonMock).toHaveBeenCalledWith({
        message: ReasonPhrases.CONFLICT,
        status: StatusCodes.CONFLICT
      })
    })
  })

  describe('resetPassword', () => {
    it('should send reset password email successfully', async () => {
      const mockUser = createMockUser()
      ;(userService.getByEmail as jest.Mock).mockResolvedValue(mockUser)
      ;(redis.client.get as jest.Mock).mockResolvedValue(null)
      ;(resetPasswordService.create as jest.Mock).mockResolvedValue({
        id: new ObjectId()
      })

      const mockRequest: Partial<IBodyRequest<any>> = {
        body: {
          email: 'test@example.com'
        }
      }

      await authController.resetPassword(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response
      )

      expect(redis.client.get).toHaveBeenCalledWith(
        `${RedisKeyPrefix.ResetPasswordRateLimit}test@example.com`
      )
      expect(userService.getByEmail).toHaveBeenCalledWith('test@example.com')
      expect(resetPasswordService.create).toHaveBeenCalled()
      expect(redis.client.set).toHaveBeenCalledWith(
        `${RedisKeyPrefix.ResetPasswordRateLimit}test@example.com`,
        1,
        {
          EX: ExpiresInSeconds.ResetPasswordRateLimit,
          NX: false
        }
      )
      expect(statusMock).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should return OK even when user does not exist (security)', async () => {
      ;(userService.getByEmail as jest.Mock).mockResolvedValue(null)
      ;(redis.client.get as jest.Mock).mockResolvedValue(null)

      const mockRequest: Partial<IBodyRequest<any>> = {
        body: {
          email: 'nonexistent@example.com'
        }
      }

      await authController.resetPassword(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response
      )

      expect(statusMock).toHaveBeenCalledWith(StatusCodes.OK)
      expect(resetPasswordService.create).not.toHaveBeenCalled()
    })

    it('should return TOO_MANY_REQUESTS when rate limit exceeded', async () => {
      ;(redis.client.get as jest.Mock).mockResolvedValue('3')

      const mockRequest: Partial<IBodyRequest<any>> = {
        body: {
          email: 'test@example.com'
        }
      }

      await authController.resetPassword(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response
      )

      expect(statusMock).toHaveBeenCalledWith(StatusCodes.TOO_MANY_REQUESTS)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Too many password reset requests. Please try again later.',
        status: StatusCodes.TOO_MANY_REQUESTS
      })
    })

    it('should increment rate limit counter on each request', async () => {
      const mockUser = createMockUser()
      ;(userService.getByEmail as jest.Mock).mockResolvedValue(mockUser)
      ;(redis.client.get as jest.Mock).mockResolvedValue('2')
      ;(resetPasswordService.create as jest.Mock).mockResolvedValue({
        id: new ObjectId()
      })

      const mockRequest: Partial<IBodyRequest<any>> = {
        body: {
          email: 'test@example.com'
        }
      }

      await authController.resetPassword(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response
      )

      expect(redis.client.set).toHaveBeenCalledWith(
        expect.any(String),
        3,
        expect.any(Object)
      )
    })
  })

  describe('newPassword', () => {
    const mockAccessToken = 'valid-reset-token-123'

    it('should reset password successfully with valid token', async () => {
      const mockUser = createMockUser()
      const mockResetPassword = {
        user: mockUserId,
        accessToken: mockAccessToken
      }
      ;(redis.client.get as jest.Mock).mockResolvedValue(null)
      ;(resetPasswordService.getByValidAccessToken as jest.Mock).mockResolvedValue(
        mockResetPassword
      )
      ;(userService.getById as jest.Mock).mockResolvedValue(mockUser)

      const mockRequest: Partial<ICombinedRequest<any, any, any>> = {
        body: {
          password: 'NewStrongPass456'
        },
        params: {
          accessToken: mockAccessToken
        }
      }

      await authController.newPassword(
        mockRequest as ICombinedRequest<any, any, any>,
        mockResponse as Response
      )

      expect(redis.client.get).toHaveBeenCalledWith(
        `${RedisKeyPrefix.UsedResetToken}${mockAccessToken}`
      )
      expect(resetPasswordService.getByValidAccessToken).toHaveBeenCalledWith(
        mockAccessToken
      )
      expect(userService.updatePasswordByUserId).toHaveBeenCalled()
      expect(resetPasswordService.deleteManyByUserId).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Object)
      )
      expect(redis.client.set).toHaveBeenCalledWith(
        `${RedisKeyPrefix.UsedResetToken}${mockAccessToken}`,
        '1',
        {
          EX: ExpiresInSeconds.UsedResetToken,
          NX: true
        }
      )
      expect(statusMock).toHaveBeenCalledWith(StatusCodes.OK)
      expect(jsonMock).toHaveBeenCalledWith({
        data: { accessToken: 'mock-jwt-token' },
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    })

    it('should return FORBIDDEN when token has already been used', async () => {
      ;(redis.client.get as jest.Mock).mockResolvedValue('1')

      const mockRequest: Partial<ICombinedRequest<any, any, any>> = {
        body: {
          password: 'NewStrongPass456'
        },
        params: {
          accessToken: mockAccessToken
        }
      }

      await authController.newPassword(
        mockRequest as ICombinedRequest<any, any, any>,
        mockResponse as Response
      )

      expect(statusMock).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Reset token has already been used.',
        status: StatusCodes.FORBIDDEN
      })
    })

    it('should return FORBIDDEN when token is invalid or expired', async () => {
      ;(redis.client.get as jest.Mock).mockResolvedValue(null)
      ;(resetPasswordService.getByValidAccessToken as jest.Mock).mockResolvedValue(null)

      const mockRequest: Partial<ICombinedRequest<any, any, any>> = {
        body: {
          password: 'NewStrongPass456'
        },
        params: {
          accessToken: 'invalid-token'
        }
      }

      await authController.newPassword(
        mockRequest as ICombinedRequest<any, any, any>,
        mockResponse as Response
      )

      expect(statusMock).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
      expect(jsonMock).toHaveBeenCalledWith({
        message: ReasonPhrases.FORBIDDEN,
        status: StatusCodes.FORBIDDEN
      })
    })

    it('should return NOT_FOUND when user does not exist', async () => {
      const mockResetPassword = {
        user: mockUserId,
        accessToken: mockAccessToken
      }
      ;(redis.client.get as jest.Mock).mockResolvedValue(null)
      ;(resetPasswordService.getByValidAccessToken as jest.Mock).mockResolvedValue(
        mockResetPassword
      )
      ;(userService.getById as jest.Mock).mockResolvedValue(null)

      const mockRequest: Partial<ICombinedRequest<any, any, any>> = {
        body: {
          password: 'NewStrongPass456'
        },
        params: {
          accessToken: mockAccessToken
        }
      }

      await authController.newPassword(
        mockRequest as ICombinedRequest<any, any, any>,
        mockResponse as Response
      )

      expect(statusMock).toHaveBeenCalledWith(StatusCodes.NOT_FOUND)
      expect(jsonMock).toHaveBeenCalledWith({
        message: ReasonPhrases.NOT_FOUND,
        status: StatusCodes.NOT_FOUND
      })
    })
  })

  describe('signOut', () => {
    it('should sign out successfully and blacklist token', async () => {
      const mockUser = createMockUser()
      const mockAccessToken = 'valid-jwt-token'

      const mockRequest: Partial<IContextRequest<IUserRequest>> = {
        context: {
          user: mockUser as any,
          accessToken: mockAccessToken
        }
      }

      await authController.signOut(
        mockRequest as IContextRequest<IUserRequest>,
        mockResponse as Response
      )

      expect(redis.client.set).toHaveBeenCalledWith(
        `expiredToken:${mockAccessToken}`,
        `${mockUserId}`,
        {
          EX: process.env.REDIS_TOKEN_EXPIRATION,
          NX: true
        }
      )
      expect(statusMock).toHaveBeenCalledWith(StatusCodes.OK)
      expect(jsonMock).toHaveBeenCalledWith({
        message: ReasonPhrases.OK,
        status: StatusCodes.OK
      })
    })
  })
})
