/*
  Warnings:

  - You are about to drop the column `amount` on the `expenses` table. All the data in the column will be lost.
  - Added the required column `amountTTC` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxesAmount` to the `expenses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "amount",
ADD COLUMN     "amountTTC" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "taxesAmount" DECIMAL(15,2) NOT NULL;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
