import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../bank-transactions/route'

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
      findMany: vi.fn(),
    },
  },
}))

describe('Bank Transactions API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/bank-transactions', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/bank-transactions')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return 404 when user has no active organization', async () => {
      const { getServerSession } = await import('next-auth')
      const { db } = await import('@/lib/db')

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123' },
      } as any)

      vi.mocked(db.organizationMembership.findFirst).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/bank-transactions')
      const response = await GET(request)

      expect(response.status).toBe(404)
    })

    it('should return bank transactions for authenticated user', async () => {
      const { getServerSession } = await import('next-auth')
      const { db } = await import('@/lib/db')

      const mockTransactions = [
        {
          id: 'tx-1',
          hash: 'hash-1',
          date: new Date('2025-08-13'),
          valueDate: new Date('2025-08-13'),
          amount: 50.00,
          description: 'Test transaction',
          balance: 100.00,
          createdAt: new Date(),
          updatedAt: new Date(),
          expenseAssociations: [],
        },
      ]

      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'user-123' },
      } as any)

      vi.mocked(db.organizationMembership.findFirst).mockResolvedValue({
        organization: { id: 'org-123' },
      } as any)

      vi.mocked(db.bankTransaction.findMany).mockResolvedValue(mockTransactions)

      const request = new NextRequest('http://localhost:3000/api/bank-transactions')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveLength(1)
      expect(data[0]).toMatchObject({
        id: 'tx-1',
        hash: 'hash-1',
        amount: 50.00,
        description: 'Test transaction',
        balance: 100.00,
        expenseAssociations: [],
      })
    })
  })
})
