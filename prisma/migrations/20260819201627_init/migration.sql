-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "normativa_chunks" (
    "id" TEXT NOT NULL,
    "ficha" TEXT NOT NULL,
    "norma" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "fecha_corte" TIMESTAMP(3) NOT NULL,
    "embedding" vector(768) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "normativa_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "normativa_chunks_ficha_key" ON "normativa_chunks"("ficha");
