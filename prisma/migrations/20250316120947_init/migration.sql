-- CreateTable
CREATE TABLE "Solution" (
    "id" SERIAL NOT NULL,
    "platform" TEXT NOT NULL,
    "contestName" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solution_pkey" PRIMARY KEY ("id")
);
