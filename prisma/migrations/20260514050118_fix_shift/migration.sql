-- AddForeignKey
ALTER TABLE "cash_proofs" ADD CONSTRAINT "cash_proofs_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
