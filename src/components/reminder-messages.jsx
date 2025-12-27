"use client";

import React, { useState } from "react";
import {
  Flame,
  Sparkles,
  Snowflake,
} from "lucide-react";
import { ReminderSection } from "./reminder-components/reminder-section";

// --- Componente Principal ---
export default function ReminderMessages({
  token,
  chatbotSlug,
  chatbotId,
  initialData = { hot: {}, normal: {}, cold: {} },
}) {
  const messageTypes = [
    {
      key: "hot",
      label: "Hot",
      description:
        "Mensajes de seguimiento inmediato para leads con alta intención de compra.",
      icon: Flame,
      badgeClass:
        "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100",
      areaClass:
        "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900",
    },
    {
      key: "normal",
      label: "Normal",
      description:
        "Mensajes regulares para mantener la conversación activa con leads interesados.",
      icon: Sparkles,
      badgeClass:
        "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100",
      areaClass:
        "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900",
    },
    {
      key: "cold",
      label: "Cold",
      description:
        "Mensajes para reenganchar contactos fríos que han perdido interés.",
      icon: Snowflake,
      badgeClass:
        "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-100",
      areaClass:
        "bg-sky-50/70 dark:bg-sky-950/30 border-sky-200/60 dark:border-sky-900",
    },
  ];

  // State to hold data, initialized from props
  const [sectionData, setSectionData] = useState(initialData);

  const handleSaveSuccess = (typeKey, savedGroups) => {
    // Update local state with saved data
    setSectionData(prev => ({
        ...prev,
        [typeKey]: {
            ...prev[typeKey],
            remarketing_groups: savedGroups
        }
    }));
  };

  return (
    <div className="w-full">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-stretch">
        {messageTypes.map((cfg) => {
          const data = sectionData[cfg.key] || {};
          
          return (
            <ReminderSection
              key={cfg.key}
              typeKey={cfg.key}
              config={cfg}
              data={data}
              chatbotId={chatbotId}
              token={token}
              onSaveSuccess={handleSaveSuccess}
              allSectionsData={sectionData}
            />
          );
        })}
      </div>
    </div>
  );
}
