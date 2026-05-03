-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streakCount" INTEGER NOT NULL DEFAULT 0,
    "streakDate" DATETIME,
    "prefs" TEXT NOT NULL DEFAULT '{}'
);

-- CreateTable
CREATE TABLE "Topic" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "partSlug" TEXT NOT NULL,
    "partIndex" INTEGER NOT NULL,
    "topicIndex" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "hook" TEXT NOT NULL,
    "estMinutes" INTEGER NOT NULL,
    "hasHeroViz" BOOLEAN NOT NULL DEFAULT false,
    "vizKey" TEXT,
    "prereqs" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topicSlug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "mastery" REAL NOT NULL DEFAULT 0,
    "scrollDepth" REAL NOT NULL DEFAULT 0,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Progress_topicSlug_fkey" FOREIGN KEY ("topicSlug") REFERENCES "Topic" ("slug") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topicSlug" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selected" INTEGER NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "timeMs" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuizAttempt_topicSlug_fkey" FOREIGN KEY ("topicSlug") REFERENCES "Topic" ("slug") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topicSlug" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "easiness" REAL NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "dueAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastGrade" INTEGER,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReviewItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReviewItem_topicSlug_fkey" FOREIGN KEY ("topicSlug") REFERENCES "Topic" ("slug") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Topic_partIndex_topicIndex_idx" ON "Topic"("partIndex", "topicIndex");

-- CreateIndex
CREATE INDEX "Progress_userId_idx" ON "Progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_userId_topicSlug_key" ON "Progress"("userId", "topicSlug");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_topicSlug_idx" ON "QuizAttempt"("userId", "topicSlug");

-- CreateIndex
CREATE INDEX "ReviewItem_userId_dueAt_idx" ON "ReviewItem"("userId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewItem_userId_topicSlug_questionId_key" ON "ReviewItem"("userId", "topicSlug", "questionId");
