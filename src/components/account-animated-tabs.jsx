"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AccountProfileForm from "@/components/account-profile-form";
import AccountPasswordForm from "@/components/account-password-form";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/contexts/language-context";

export default function AccountAnimatedTabs({
  displayName,
  displayEmail,
  initials,
  providerLabel,
  gravatarUrl,
  initialName,
  initialPhone,
}) {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="profile">
          {t("account.tabs.profile", { fallback: "Perfil" })}
        </TabsTrigger>
        <TabsTrigger value="security">
          {t("account.tabs.security", { fallback: "Seguridad" })}
        </TabsTrigger>
      </TabsList>

      <div className="mt-2 p-4 border rounded-md">
        <TabsContent value="profile">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="space-y-4"
            >
              <div className="mb-4 md:mb-6">
                <div className="flex items-start gap-3">
                  <Avatar className="size-9">
                    <AvatarImage src={gravatarUrl} alt={displayEmail || displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold tracking-tight leading-none">{displayName}</span>
                      <span className="text-xs rounded-md border px-2 py-0.5 text-muted-foreground">
                        {providerLabel}
                      </span>
                    </div>
                    <span className="leading-none text-sm text-muted-foreground">{displayEmail}</span>
                  </div>
                </div>
              </div>
              <h2 className="text-lg font-semibold">
                {t("account.profile.title", { fallback: "Editar perfil" })}
              </h2>
              {/* <p className="text-sm text-muted-foreground">
                {t("account.profile.subtitle", { fallback: "Actualiza tu nombre y telefono." })}
              </p> */}
              <AccountProfileForm initialName={initialName} initialPhone={initialPhone} />
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="security">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold">
                {t("account.security.title", { fallback: "Cambiar contrasena" })}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("account.security.subtitle", {
                  fallback: "Introduce tu contrasena actual y la nueva.",
                })}
              </p>
              <AccountPasswordForm />
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </div>
    </Tabs>
  );
}
