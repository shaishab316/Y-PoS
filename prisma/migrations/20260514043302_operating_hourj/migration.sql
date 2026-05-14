-- CreateTable
CREATE TABLE "OperatingHours" (
    "id" SERIAL NOT NULL,
    "sundayStart" TEXT,
    "sundayEnd" TEXT,
    "mondayStart" TEXT,
    "mondayEnd" TEXT,
    "tuesdayStart" TEXT,
    "tuesdayEnd" TEXT,
    "wednesdayStart" TEXT,
    "wednesdayEnd" TEXT,
    "thursdayStart" TEXT,
    "thursdayEnd" TEXT,
    "fridayStart" TEXT,
    "fridayEnd" TEXT,
    "saturdayStart" TEXT,
    "saturdayEnd" TEXT,

    CONSTRAINT "OperatingHours_pkey" PRIMARY KEY ("id")
);
