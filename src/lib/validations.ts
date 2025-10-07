import { z } from 'zod'

// ===== AUTHENTICATION SCHEMAS =====

export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ===== ORGANIZATION SCHEMAS =====

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  taxId: z.string().optional(),
})

export const updateOrganizationSchema = createOrganizationSchema.partial()

// ===== PROJECT SCHEMAS =====

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  goal: z.number().positive().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

// ===== DONATION SCHEMAS =====

export const createDonationSchema = z.object({
  projectId: z.string().optional(),
  donorName: z.string().min(2, 'Donor name must be at least 2 characters'),
  donorEmail: z.string().email().optional().or(z.literal('')),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['ONE_TIME', 'RECURRING']),
  paymentMethod: z.enum(['CASH', 'CHECK', 'CREDIT_CARD', 'BANK_TRANSFER', 'PAYPAL', 'OTHER']).optional(),
  notes: z.string().optional(),
  date: z.date().default(() => new Date()),
})

export const updateDonationSchema = createDonationSchema.partial()

// ===== EXPENSE SCHEMAS =====

export const createExpenseSchema = z.object({
  categoryId: z.string().optional(),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  amount: z.number().positive('Amount must be positive'),
  date: z.date().default(() => new Date()),
  receipt: z.string().optional(),
})

export const updateExpenseSchema = createExpenseSchema.partial()

export const approveExpenseSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().optional(),
})

// ===== CATEGORY SCHEMAS =====

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
  color: z.string().optional(),
})

export const updateCategorySchema = createCategorySchema.partial()

// ===== ACCOUNT SCHEMAS =====

export const createAccountSchema = z.object({
  code: z.string().min(2, 'Account code must be at least 2 characters'),
  name: z.string().min(2, 'Account name must be at least 2 characters'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  parentId: z.string().optional(),
})

export const updateAccountSchema = createAccountSchema.partial()

// ===== TRANSACTION SCHEMAS =====

export const createTransactionSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['DEBIT', 'CREDIT']),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  reference: z.string().optional(),
  date: z.date().default(() => new Date()),
})

export const updateTransactionSchema = createTransactionSchema.partial()

// ===== MEMBERSHIP SCHEMAS =====

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']),
})

export const updateMembershipSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']),
})

// ===== REPORT SCHEMAS =====

export const generateReportSchema = z.object({
  type: z.enum(['FINANCIAL_SUMMARY', 'DONATION_REPORT', 'EXPENSE_REPORT', 'PROJECT_REPORT', 'TAX_REPORT']),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  parameters: z.record(z.any()).optional(),
})

// ===== TYPE EXPORTS =====

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type CreateDonationInput = z.infer<typeof createDonationSchema>
export type UpdateDonationInput = z.infer<typeof updateDonationSchema>
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
export type ApproveExpenseInput = z.infer<typeof approveExpenseSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>
export type GenerateReportInput = z.infer<typeof generateReportSchema>
