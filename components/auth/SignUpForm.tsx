"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { checkUsernameAvailable, signUp } from "@/lib/actions/auth";

type UsernameStatus = "idle" | "checking" | "available" | "taken";

export function SignUpForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const username = watch("username");

  useEffect(() => {
    if (!username || errors.username) {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    const timeout = setTimeout(async () => {
      const available = await checkUsernameAvailable(username);
      setUsernameStatus(available ? "available" : "taken");
    }, 400);

    return () => clearTimeout(timeout);
  }, [username, errors.username]);

  const onSubmit = async (data: SignUpInput) => {
    setServerError(null);
    setSuccessMessage(null);
    if (usernameStatus === "taken") {
      setServerError("That username is already taken.");
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(data);
    setIsSubmitting(false);

    if (result && "error" in result) {
      setServerError(result.error);
    } else if (result && "message" in result) {
      setSuccessMessage(result.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="off"
          {...register("username")}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <p className="text-xs text-neutral-500">
          shelfie.app/<span className="font-medium">{username || "yourname"}</span>/your-space
        </p>
        {errors.username && (
          <p className="text-xs text-red-600">{errors.username.message}</p>
        )}
        {!errors.username && usernameStatus === "checking" && (
          <p className="text-xs text-neutral-500">Checking availability…</p>
        )}
        {!errors.username && usernameStatus === "taken" && (
          <p className="text-xs text-red-600">That username is taken.</p>
        )}
        {!errors.username && usernameStatus === "available" && (
          <p className="text-xs text-green-700">Available.</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        {errors.password && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      {successMessage && (
        <p className="text-sm text-green-700">{successMessage}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
