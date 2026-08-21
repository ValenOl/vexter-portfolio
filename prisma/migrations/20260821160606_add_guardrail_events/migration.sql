-- CreateTable
CREATE TABLE "guardrail_events" (
    "id" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "texto_evaluado" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "guardrail_triggered" TEXT,
    "fichas_disponibles" INTEGER NOT NULL DEFAULT 0,
    "fichas_citadas" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardrail_events_pkey" PRIMARY KEY ("id")
);
