"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import TagManagement from "./tag-management";

export default function TagsPageClient({ tags, loadError, session, chatbot }) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col px-4 lg:px-6">
      <div className="@container/main flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Etiquetas</h1>
            <p className="text-sm text-muted-foreground">
              Administra las etiquetas que facilitan la clasificacion de
              clientes y conversaciones.
            </p>
          </div>
          <Button
            className="w-full sm:w-auto"
            disabled={!session?.strapiToken || !chatbot?.documentId}
            onClick={() => setCreateOpen(true)}
          >
            Nueva etiqueta
          </Button>
        </div>

        {loadError && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            {loadError}
          </div>
        )}

        <TagManagement
          initialTags={tags}
          token={session?.strapiToken}
          chatbotId={chatbot?.documentId}
          createOpen={createOpen}
          onCreateOpenChange={setCreateOpen}
        />
      </div>
    </div>
  );
}
