-- Module 08: fixed school settings remain on School; add only missing configuration fields.
ALTER TABLE "schools"
  ADD COLUMN "dateFormat" VARCHAR(32) NOT NULL DEFAULT 'YYYY-MM-DD',
  ADD COLUMN "studentNumberPrefix" VARCHAR(20),
  ADD COLUMN "invoiceNumberPrefix" VARCHAR(20);
