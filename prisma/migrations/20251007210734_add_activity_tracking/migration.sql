-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('EXPENSE_CREATED', 'EXPENSE_APPROVED', 'EXPENSE_REJECTED', 'EXPENSE_UPDATED', 'CATEGORY_CREATED', 'CATEGORY_UPDATED', 'CATEGORY_DELETED', 'MEMBER_JOINED', 'MEMBER_LEFT', 'MEMBER_ROLE_CHANGED', 'ORGANIZATION_UPDATED', 'USER_LOGIN', 'USER_LOGOUT');

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
