-- Prisma uses gen_random_uuid() for application-owned UUID primary keys.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "UserProfileStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');

-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "avatarUrl" VARCHAR(2048),
    "platformRole" "PlatformRole",
    "status" "UserProfileStatus" NOT NULL DEFAULT 'INVITED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "timezone" VARCHAR(64) NOT NULL,
    "currencyCode" CHAR(3) NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "status" "SchoolStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_memberships" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "joinedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "school_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "schools_slug_key" ON "schools"("slug");

-- CreateIndex
CREATE INDEX "schools_status_createdAt_idx" ON "schools"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "school_memberships_schoolId_userId_key" ON "school_memberships"("schoolId", "userId");

-- CreateIndex
CREATE INDEX "school_memberships_userId_status_idx" ON "school_memberships"("userId", "status");

-- CreateIndex
CREATE INDEX "school_memberships_schoolId_status_idx" ON "school_memberships"("schoolId", "status");

-- AddForeignKey
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
