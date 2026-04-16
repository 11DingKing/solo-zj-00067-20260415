import { NextFunction, Response } from 'express'
import { StatusCodes } from 'http-status-codes'

import { authValidation } from '@/validations/authValidation'
import { IBodyRequest } from '@/contracts/request'

describe('authValidation', () => {
  let mockRequest: Partial<IBodyRequest<any>>
  let mockResponse: Partial<Response>
  let mockNext: NextFunction
  let jsonMock: jest.Mock

  beforeEach(() => {
    jsonMock = jest.fn()
    mockRequest = {
      body: {}
    }
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jsonMock
    } as Partial<Response>
    mockNext = jest.fn()
  })

  describe('signUp validation', () => {
    it('should pass validation with strong password', () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'StrongPass123'
      }

      authValidation.signUp(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
    })

    it('should fail validation when password is too short', () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Ab1'
      }

      authValidation.signUp(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(jsonMock).toHaveBeenCalledWith({
        message:
          'Password must be at least 8 characters long and contain uppercase, lowercase letters and numbers.',
        status: StatusCodes.BAD_REQUEST
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should fail validation when password has no uppercase letter', () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'weakpass123'
      }

      authValidation.signUp(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should fail validation when password has no lowercase letter', () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'WEAKPASS123'
      }

      authValidation.signUp(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should fail validation when password has no number', () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'WeakPassword'
      }

      authValidation.signUp(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should fail validation when email is missing', () => {
      mockRequest.body = {
        password: 'StrongPass123'
      }

      authValidation.signUp(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should fail validation when password is missing', () => {
      mockRequest.body = {
        email: 'test@example.com'
      }

      authValidation.signUp(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should fail validation when email is invalid', () => {
      mockRequest.body = {
        email: 'invalid-email',
        password: 'StrongPass123'
      }

      authValidation.signUp(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('newPassword validation', () => {
    it('should pass validation with strong password', () => {
      mockRequest.body = {
        password: 'NewStrongPass456'
      }

      authValidation.newPassword(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
    })

    it('should fail validation when password is too short', () => {
      mockRequest.body = {
        password: 'Ab1'
      }

      authValidation.newPassword(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(jsonMock).toHaveBeenCalledWith({
        message:
          'Password must be at least 8 characters long and contain uppercase, lowercase letters and numbers.',
        status: StatusCodes.BAD_REQUEST
      })
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should fail validation when password has no uppercase letter', () => {
      mockRequest.body = {
        password: 'weakpass123'
      }

      authValidation.newPassword(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should fail validation when password has no lowercase letter', () => {
      mockRequest.body = {
        password: 'WEAKPASS123'
      }

      authValidation.newPassword(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should fail validation when password has no number', () => {
      mockRequest.body = {
        password: 'WeakPassword'
      }

      authValidation.newPassword(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should fail validation when password is missing', () => {
      mockRequest.body = {}

      authValidation.newPassword(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('signIn validation', () => {
    it('should pass validation with valid credentials', () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'anyPassword'
      }

      authValidation.signIn(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
    })

    it('should fail validation when email is missing', () => {
      mockRequest.body = {
        password: 'anyPassword'
      }

      authValidation.signIn(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should fail validation when password is missing', () => {
      mockRequest.body = {
        email: 'test@example.com'
      }

      authValidation.signIn(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockNext).not.toHaveBeenCalled()
    })
  })

  describe('resetPassword validation', () => {
    it('should pass validation with valid email', () => {
      mockRequest.body = {
        email: 'test@example.com'
      }

      authValidation.resetPassword(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockNext).toHaveBeenCalled()
    })

    it('should fail validation when email is missing', () => {
      mockRequest.body = {}

      authValidation.resetPassword(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should fail validation when email is invalid', () => {
      mockRequest.body = {
        email: 'invalid-email'
      }

      authValidation.resetPassword(
        mockRequest as IBodyRequest<any>,
        mockResponse as Response,
        mockNext
      )

      expect(mockResponse.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
      expect(mockNext).not.toHaveBeenCalled()
    })
  })
})
