import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../bank-transactions/import/route'

// Mock the dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/db', () => ({
  db: {
    organizationMembership: {
      findFirst: vi.fn(),
    },
    bankTransaction: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/activity-utils', () => ({
  createActivity: vi.fn(),
}))

vi.mock('@/lib/bank-utils', () => ({
  handleFileEncoding: vi.fn(),
  parseCSV: vi.fn(),
  generateTransactionHash: vi.fn(),
  parseFrenchDate: vi.fn(),
}))

describe('Bank Transactions Import API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/bank-transactions/import', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue(null)

      const formData = new FormData()
      formData.append('file', new File(['test'], 'test.csv'))

      const request = new NextRequest('http://localhost:3000/api/bank-transactions/import', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('should return 400 when no file is provided', async () => {
      const { getServerSession } = await import('next-auth')
      const { db } = await import('@/lib/db')

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123' },
      } as any)

      vi.mocked(db.organizationMembership.findFirst).mockResolvedValue({
        organization: { id: 'org-123' },
      } as any)

      const formData = new FormData()
      // No file appended

      const request = new NextRequest('http://localhost:3000/api/bank-transactions/import', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })
})
