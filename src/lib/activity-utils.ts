import { db } from './db'
import { ActivityType } from '@/lib/prisma'

export interface ActivityData {
  organizationId: string
  userId: string
  type: ActivityType
  entityType?: string
  entityId?: string
  description: string
  metadata?: Record<string, unknown>
}

/**
 * Creates a new activity record
 */
export async function createActivity(data: ActivityData) {
  try {
    const activity = await db.activity.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        type: data.type,
        entityType: data.entityType,
        entityId: data.entityId,
        description: data.description,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })
    return activity
  } catch (error) {
    console.error('Failed to create activity:', error)
    throw error
  }
}

/**
 * Gets recent activities for an organization
 */
export async function getRecentActivities(
  organizationId: string,
  limit: number = 10
) {
  try {
    const activities = await db.activity.findMany({
      where: {
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })
    return activities
  } catch (error) {
    console.error('Failed to get recent activities:', error)
    throw error
  }
}

/**
 * Activity helper functions for common operations
 */
export const activityHelpers = {
  /**
   * Log expense creation
   */
  async logExpenseCreated(
    organizationId: string,
    userId: string,
    expenseId: string,
    amount: number,
    description: string
  ) {
    return createActivity({
      organizationId,
      userId,
      type: ActivityType.EXPENSE_CREATED,
      entityType: 'expense',
      entityId: expenseId,
      description: `Created expense: ${description}`,
      metadata: {
        amount,
        expenseId,
      },
    })
  },

  /**
   * Log expense update
   */
  async logExpenseUpdated(
    organizationId: string,
    userId: string,
    expenseId: string,
    amount: number,
    description: string
  ) {
    return createActivity({
      organizationId,
      userId,
      type: ActivityType.EXPENSE_UPDATED,
      entityType: 'expense',
      entityId: expenseId,
      description: `Updated expense: ${description}`,
      metadata: {
        amount,
        expenseId,
      },
    })
  },

  /**
   * Log expense approval
   */
  async logExpenseApproved(
    organizationId: string,
    userId: string,
    expenseId: string,
    amount: number,
    description: string
  ) {
    return createActivity({
      organizationId,
      userId,
      type: ActivityType.EXPENSE_APPROVED,
      entityType: 'expense',
      entityId: expenseId,
      description: `Approved expense: ${description}`,
      metadata: {
        amount,
        expenseId,
      },
    })
  },

  /**
   * Log expense rejection
   */
  async logExpenseRejected(
    organizationId: string,
    userId: string,
    expenseId: string,
    amount: number,
    description: string
  ) {
    return createActivity({
      organizationId,
      userId,
      type: ActivityType.EXPENSE_REJECTED,
      entityType: 'expense',
      entityId: expenseId,
      description: `Rejected expense: ${description}`,
      metadata: {
        amount,
        expenseId,
      },
    })
  },

  /**
   * Log category creation
   */
  async logCategoryCreated(
    organizationId: string,
    userId: string,
    categoryId: string,
    categoryName: string
  ) {
    return createActivity({
      organizationId,
      userId,
      type: ActivityType.CATEGORY_CREATED,
      entityType: 'category',
      entityId: categoryId,
      description: `Created category: ${categoryName}`,
      metadata: {
        categoryId,
        categoryName,
      },
    })
  },

  /**
   * Log member joining
   */
  async logMemberJoined(
    organizationId: string,
    userId: string,
    memberName: string
  ) {
    return createActivity({
      organizationId,
      userId,
      type: ActivityType.MEMBER_JOINED,
      entityType: 'member',
      entityId: userId,
      description: `${memberName} joined the organization`,
      metadata: {
        memberName,
      },
    })
  },

  /**
   * Log user login
   */
  async logUserLogin(organizationId: string, userId: string) {
    return createActivity({
      organizationId,
      userId,
      type: ActivityType.USER_LOGIN,
      description: 'User logged in',
      metadata: {
        loginTime: new Date().toISOString(),
      },
    })
  },

  /**
   * Log bank transactions import
   */
  async logBankTransactionsImported(
    organizationId: string,
    userId: string,
    importedCount: number,
    skippedCount: number,
    fileName: string
  ) {
    return createActivity({
      organizationId,
      userId,
      type: ActivityType.BANK_TRANSACTIONS_IMPORTED,
      entityType: 'bank_transaction',
      description: `Imported ${importedCount} bank transactions from ${fileName}`,
      metadata: {
        importedCount,
        skippedCount,
        fileName,
      },
    })
  },

  /**
   * Log bank transaction expense association
   */
  async logBankTransactionExpenseAssociated(
    organizationId: string,
    userId: string,
    bankTransactionId: string,
    expenseId: string,
    amount: number,
    expenseDescription: string
  ) {
    return createActivity({
      organizationId,
      userId,
      type: ActivityType.BANK_TRANSACTION_EXPENSE_ASSOCIATED,
      entityType: 'bank_transaction',
      entityId: bankTransactionId,
      description: `Associated expense "${expenseDescription}" with bank transaction`,
      metadata: {
        bankTransactionId,
        expenseId,
        amount,
        expenseDescription,
      },
    })
  },
}
