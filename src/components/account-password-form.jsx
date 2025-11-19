"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/language-context";

const PASSWORD_RULES = [
  { key: "length", test: (value) => value.length >= 8 },
  { key: "uppercase", test: (value) => /[A-Z]/.test(value) },
  { key: "number", test: (value) => /\d/.test(value) },
  { key: "symbol", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export default function AccountPasswordForm() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const passwordHints = useMemo(
    () => ({
      length: t("account.security.rules.length", {
        fallback: "Al menos 8 caracteres.",
      }),
      uppercase: t("account.security.rules.uppercase", {
        fallback: "Debe incluir una mayuscula.",
      }),
      number: t("account.security.rules.number", {
        fallback: "Debe incluir un numero.",
      }),
      symbol: t("account.security.rules.symbol", {
        fallback: "Debe incluir un simbolo.",
      }),
      match: t("account.security.rules.match", {
        fallback: "La confirmacion debe coincidir.",
      }),
      difference: t("account.security.rules.different", {
        fallback: "La nueva contrasena debe ser distinta a la actual.",
      }),
    }),
    [t]
  );

  const validate = () => {
    const nextErrors = {};

    if (!currentPassword) {
      nextErrors.currentPassword = t("account.security.errors.currentRequired", {
        fallback: "Ingresa tu contrasena actual.",
      });
    }

    if (!password) {
      nextErrors.password = t("account.security.errors.newRequired", {
        fallback: "Ingresa una nueva contrasena.",
      });
    } else {
      PASSWORD_RULES.forEach((rule) => {
        if (!rule.test(password)) {
          nextErrors.password = passwordHints[rule.key];
        }
      });
    }

    if (password && password === currentPassword) {
      nextErrors.password = passwordHints.difference;
    }

    if (!passwordConfirmation) {
      nextErrors.passwordConfirmation = passwordHints.match;
    } else if (password !== passwordConfirmation) {
      nextErrors.passwordConfirmation = passwordHints.match;
    }

    return nextErrors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      toast.error(
        t("account.security.errors.validation", { fallback: "Revisa la informacion ingresada." })
      );
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password, passwordConfirmation }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          data?.error || t("account.security.errors.generic", { fallback: "No se pudo cambiar la contrasena." })
        );
      } else {
        toast.success(
          t("account.security.success", { fallback: "Contrasena actualizada correctamente." })
        );
        setCurrentPassword("");
        setPassword("");
        setPasswordConfirmation("");
      }
    } catch (err) {
      toast.error(
        t("account.security.errors.network", { fallback: "Error de red al cambiar la contrasena." })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="currentPassword">
            {t("account.security.fields.current", { fallback: "Contrasena actual" })}
          </FieldLabel>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("account.security.placeholders.current", { fallback: "Tu contrasena actual" })}
            autoComplete="current-password"
            required
            aria-invalid={errors.currentPassword ? "true" : "false"}
          />
          {errors.currentPassword ? (
            <p className="mt-1 text-xs text-destructive">{errors.currentPassword}</p>
          ) : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="password">
            {t("account.security.fields.new", { fallback: "Nueva contrasena" })}
          </FieldLabel>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("account.security.placeholders.new", { fallback: "Nueva contrasena" })}
            autoComplete="new-password"
            required
            aria-invalid={errors.password ? "true" : "false"}
          />
          {errors.password ? <p className="mt-1 text-xs text-destructive">{errors.password}</p> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="passwordConfirmation">
            {t("account.security.fields.confirm", { fallback: "Confirmar nueva contrasena" })}
          </FieldLabel>
          <Input
            id="passwordConfirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder={t("account.security.placeholders.confirm", { fallback: "Confirmar nueva contrasena" })}
            autoComplete="new-password"
            required
            aria-invalid={errors.passwordConfirmation ? "true" : "false"}
          />
          {errors.passwordConfirmation ? (
            <p className="mt-1 text-xs text-destructive">{errors.passwordConfirmation}</p>
          ) : null}
        </Field>

        <Field>
          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? t("common.saving", { fallback: "Guardando..." })
              : t("account.security.actions.submit", { fallback: "Cambiar contrasena" })}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
