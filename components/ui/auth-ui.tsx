"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  MailCheck,
  RefreshCw,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed
    );

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    text,
    textArray.length,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
}

const labelVariants = cva(
  "text-sm font-medium leading-none text-white peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-neutral-200 shadow-sm",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-500",
        outline:
          "border border-neutral-700 bg-neutral-900 text-white shadow-sm hover:bg-neutral-800",
        secondary:
          "bg-neutral-800 text-white hover:bg-neutral-700",
        ghost: "hover:bg-neutral-800 text-neutral-200 hover:text-white",
        link: "text-neutral-300 underline-offset-4 hover:underline hover:text-white",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-sm text-white shadow-sm transition-colors placeholder:text-neutral-500 focus-visible:border-neutral-500 focus-visible:bg-neutral-900 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

    return (
      <div className="grid w-full items-center gap-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input
            id={id}
            type={showPassword ? "text" : "password"}
            className={cn("pe-10", className)}
            ref={ref}
            {...props}
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-neutral-400 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

interface SignInFormProps {
  onSubmitEmail?: (email: string, password: string) => void | Promise<void>;
  onValidationError?: (msg: string) => void;
  isLoading?: boolean;
}

function SignInForm({ onSubmitEmail, onValidationError, isLoading }: SignInFormProps) {
  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (!STRICT_EMAIL_REGEX.test(email)) {
      onValidationError?.("Please enter a valid email address (e.g., name@domain.com).");
      return;
    }
    if (!password || password.length < 6) {
      onValidationError?.("Incorrect email or password. Passwords must be at least 6 characters.");
      return;
    }

    if (onSubmitEmail) {
      await onSubmitEmail(email, password);
    }
  };

  return (
    <form
      onSubmit={handleSignIn}
      autoComplete="on"
      noValidate
      className="flex flex-col gap-5 sm:gap-6"
    >
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-2xl font-bold text-white">
          Sign in to your account
        </h1>
        <p className="text-balance text-xs text-neutral-400">
          Verified Firebase Email/Password &amp; 6-Digit OTP Authentication
        </p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
            autoComplete="email"
            disabled={isLoading}
          />
        </div>
        <PasswordInput
          name="password"
          label="Password"
          required
          minLength={6}
          autoComplete="current-password"
          placeholder="Enter your password"
          disabled={isLoading}
        />
        <Button
          type="submit"
          variant="default"
          className="mt-1 font-semibold"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Verifying Credentials...</span>
            </>
          ) : (
            "Sign In & Send OTP"
          )}
        </Button>
      </div>
    </form>
  );
}

interface SignUpFormProps {
  onSubmitSignUp?: (
    name: string,
    email: string,
    password: string
  ) => void | Promise<void>;
  onValidationError?: (msg: string) => void;
  isLoading?: boolean;
}

function SignUpForm({ onSubmitSignUp, onValidationError, isLoading }: SignUpFormProps) {
  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (!name || name.length < 2) {
      onValidationError?.("Please enter your full name (at least 2 characters).");
      return;
    }
    if (!STRICT_EMAIL_REGEX.test(email)) {
      onValidationError?.("Please enter a valid email address (e.g., name@domain.com).");
      return;
    }
    if (!password || password.length < 6) {
      onValidationError?.("Password must be at least 6 characters long.");
      return;
    }

    if (onSubmitSignUp) {
      await onSubmitSignUp(name, email, password);
    }
  };

  return (
    <form
      onSubmit={handleSignUp}
      autoComplete="on"
      noValidate
      className="flex flex-col gap-5 sm:gap-6"
    >
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-2xl font-bold text-white">Create an account</h1>
        <p className="text-balance text-xs text-neutral-400">
          Register with Firebase Auth &amp; verify your email via 6-digit OTP
        </p>
      </div>
      <div className="grid gap-3.5">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            required
            autoComplete="name"
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
            autoComplete="email"
            disabled={isLoading}
          />
        </div>
        <PasswordInput
          name="password"
          label="Password (min. 6 characters)"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Create a strong password"
          disabled={isLoading}
        />
        <Button
          type="submit"
          variant="default"
          className="mt-1 font-semibold"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            "Create Account & Send OTP"
          )}
        </Button>
      </div>
    </form>
  );
}

export interface PendingOtpDetails {
  email: string;
  emailDispatched?: boolean;
}

interface OtpVerificationFormProps {
  pendingOtp: PendingOtpDetails;
  onVerifyOtp?: (code: string) => void | Promise<void>;
  onCheckFirebaseLink?: () => void | Promise<void>;
  onResendOtp?: () => void | Promise<void>;
  onCancelOtp?: () => void | Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
}

function OtpVerificationForm({
  pendingOtp,
  onVerifyOtp,
  onCheckFirebaseLink,
  onResendOtp,
  onCancelOtp,
  isLoading,
  errorMessage,
}: OtpVerificationFormProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState<number>(30);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (index: number, value: string) => {
    const numeric = value.replace(/\D/g, "");
    if (!numeric) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    // Support pasting or typing multiple digits
    if (numeric.length > 1) {
      const chars = numeric.slice(0, 6).split("");
      const next = [...digits];
      chars.forEach((c, idx) => {
        if (index + idx < 6) {
          next[index + idx] = c;
        }
      });
      setDigits(next);
      const focusIdx = Math.min(5, index + chars.length);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = numeric;
    setDigits(next);
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((ch, idx) => {
      next[idx] = ch;
    });
    setDigits(next);
    inputRefs.current[Math.min(5, pasted.length - 1)]?.focus();
  };

  const fullCode = digits.join("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusNotice(null);
    if (fullCode.length !== 6) return;
    await onVerifyOtp?.(fullCode);
  };

  return (
    <div className="mx-auto grid w-full max-w-[360px] gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-950/40 text-emerald-400">
          <ShieldCheck className="size-5" />
        </div>
        <h1 className="text-xl font-bold text-white">Check Your Email</h1>
        <p className="text-xs text-neutral-400 leading-relaxed">
          We sent a verification email with your 6-digit OTP code to{" "}
          <span className="font-mono font-semibold text-white">{pendingOtp.email}</span>
        </p>
      </div>

      {/* Email Sent Notice */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-3 text-xs">
        <div className="flex items-start gap-2 text-emerald-300">
          <MailCheck className="size-4 shrink-0 mt-0.5 text-emerald-400" />
          <div className="leading-snug text-neutral-300">
            Open the verification email sent to{" "}
            <span className="font-semibold text-white">{pendingOtp.email}</span>{" "}
            (check Inbox &amp; Spam folder) and enter the 6-digit OTP code shown in the greeting, or click the verification link inside the email.
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="flex items-center justify-between gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isLoading}
              aria-label={`OTP digit ${index + 1}`}
              className="h-12 w-11 rounded-lg border border-neutral-700 bg-neutral-900 text-center font-mono text-lg font-bold text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            />
          ))}
        </div>

        {errorMessage && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-2.5 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="size-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {statusNotice && !errorMessage && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-2.5 text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{statusNotice}</span>
          </div>
        )}

        <Button
          type="submit"
          variant="default"
          disabled={isLoading || fullCode.length !== 6}
          className="w-full font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Verifying OTP...</span>
            </>
          ) : (
            <>
              <KeyRound className="size-4" />
              <span>Verify 6-Digit OTP</span>
            </>
          )}
        </Button>
      </form>

      {onCheckFirebaseLink && (
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={async () => {
            setStatusNotice(null);
            await onCheckFirebaseLink();
          }}
          className="w-full text-xs"
        >
          <MailCheck className="size-3.5" />
          <span>I Clicked the Verification Link in My Email</span>
        </Button>
      )}

      <div className="flex items-center justify-between pt-1 text-xs text-neutral-400">
        <button
          type="button"
          disabled={isLoading}
          onClick={onCancelOtp}
          className="inline-flex items-center gap-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Change email</span>
        </button>

        <button
          type="button"
          disabled={isLoading || cooldown > 0}
          onClick={async () => {
            if (!onResendOtp) return;
            setDigits(["", "", "", "", "", ""]);
            await onResendOtp();
            setCooldown(30);
            setStatusNotice("A new 6-digit OTP code has been generated.");
          }}
          className="inline-flex items-center gap-1 font-semibold text-white hover:underline disabled:text-neutral-500 disabled:no-underline cursor-pointer"
        >
          <RefreshCw className="size-3" />
          <span>{cooldown > 0 ? `Resend OTP (${cooldown}s)` : "Resend OTP"}</span>
        </button>
      </div>
    </div>
  );
}

interface AuthFormContainerProps {
  isSignIn: boolean;
  onToggle: () => void;
  onGoogleSignIn?: () => void | Promise<void>;
  onEmailSignIn?: (email: string, password: string) => void | Promise<void>;
  onEmailSignUp?: (
    name: string,
    email: string,
    password: string
  ) => void | Promise<void>;
  pendingOtp?: PendingOtpDetails | null;
  onVerifyOtp?: (code: string) => void | Promise<void>;
  onCheckFirebaseLink?: () => void | Promise<void>;
  onResendOtp?: () => void | Promise<void>;
  onCancelOtp?: () => void | Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
}

function AuthFormContainer({
  isSignIn,
  onToggle,
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp,
  pendingOtp,
  onVerifyOtp,
  onCheckFirebaseLink,
  onResendOtp,
  onCancelOtp,
  isLoading,
  errorMessage,
}: AuthFormContainerProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setLocalError(null);
  }, [isSignIn, pendingOtp, errorMessage]);

  if (pendingOtp) {
    return (
      <OtpVerificationForm
        pendingOtp={pendingOtp}
        onVerifyOtp={onVerifyOtp}
        onCheckFirebaseLink={onCheckFirebaseLink}
        onResendOtp={onResendOtp}
        onCancelOtp={onCancelOtp}
        isLoading={isLoading}
        errorMessage={localError || errorMessage}
      />
    );
  }

  const displayedError = localError || errorMessage;

  return (
    <div className="mx-auto grid w-full max-w-[350px] gap-3">
      {isSignIn ? (
        <SignInForm
          onSubmitEmail={(email, password) => {
            setLocalError(null);
            return onEmailSignIn?.(email, password);
          }}
          onValidationError={setLocalError}
          isLoading={isLoading}
        />
      ) : (
        <SignUpForm
          onSubmitSignUp={(name, email, password) => {
            setLocalError(null);
            return onEmailSignUp?.(name, email, password);
          }}
          onValidationError={setLocalError}
          isLoading={isLoading}
        />
      )}

      {displayedError && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-2.5 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="size-4 text-rose-400 shrink-0 mt-0.5" />
          <span className="leading-snug">{displayedError}</span>
        </div>
      )}

      <div className="text-center text-sm text-neutral-400">
        {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
        <Button
          type="button"
          variant="link"
          className="pl-1 text-white font-semibold"
          onClick={() => {
            setLocalError(null);
            onToggle();
          }}
        >
          {isSignIn ? "Sign up" : "Sign in"}
        </Button>
      </div>

      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-neutral-800">
        <span className="relative z-10 bg-neutral-950 px-2 text-neutral-400">
          Or continue with
        </span>
      </div>

      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={() => {
          setLocalError(null);
          if (onGoogleSignIn) {
            onGoogleSignIn();
          }
        }}
        className="w-full font-medium"
      >
        <img
          src="https://cdn.21st.dev/assets/mirror/38/38146bfd9eff6dbf0d74771f2e625c70d87d3770e0d080dbb6e50db1d5403f46.svg"
          alt="Google icon"
          className="mr-2 h-4 w-4"
        />
        {isLoading ? "Connecting..." : "Continue with Google"}
      </Button>
    </div>
  );
}

export interface AuthContentProps {
  image?: {
    src: string;
    alt: string;
  };
  quote?: {
    text: string;
    author: string;
  };
}

export interface AuthUIProps {
  signInContent?: AuthContentProps;
  signUpContent?: AuthContentProps;
  defaultIsSignIn?: boolean;
  onGoogleSignIn?: () => void | Promise<void>;
  onEmailSignIn?: (email: string, password: string) => void | Promise<void>;
  onEmailSignUp?: (
    name: string,
    email: string,
    password: string
  ) => void | Promise<void>;
  pendingOtp?: PendingOtpDetails | null;
  onVerifyOtp?: (code: string) => void | Promise<void>;
  onCheckFirebaseLink?: () => void | Promise<void>;
  onResendOtp?: () => void | Promise<void>;
  onCancelOtp?: () => void | Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
  className?: string;
}

const defaultSignInContent = {
  image: {
    src: "https://cdn.21st.dev/assets/mirror/39/39e7b0edd6a7156713d08ec970769bf29360427d3dc8523ee32079885ccca5dd.png",
    alt: "A beautiful interior design for sign-in",
  },
  quote: {
    text: "Welcome Back! The journey continues.",
    author: "TrustNews MOO",
  },
};

const defaultSignUpContent = {
  image: {
    src: "https://cdn.21st.dev/assets/mirror/c7/c7cb3a073970aa03472c652391db88fbbe39f1e33c8deb336a9c8e53b039ee01.png",
    alt: "A vibrant, modern space for new beginnings",
  },
  quote: {
    text: "Create an account. A new chapter awaits.",
    author: "TrustNews MOO",
  },
};

export function AuthUI({
  signInContent = {},
  signUpContent = {},
  defaultIsSignIn = true,
  onGoogleSignIn,
  onEmailSignIn,
  onEmailSignUp,
  pendingOtp,
  onVerifyOtp,
  onCheckFirebaseLink,
  onResendOtp,
  onCancelOtp,
  isLoading,
  errorMessage,
  className,
}: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(defaultIsSignIn);

  useEffect(() => {
    setIsSignIn(defaultIsSignIn);
  }, [defaultIsSignIn]);

  const toggleForm = () => setIsSignIn((prev) => !prev);

  const finalSignInContent = {
    image: { ...defaultSignInContent.image, ...signInContent.image },
    quote: { ...defaultSignInContent.quote, ...signInContent.quote },
  };
  const finalSignUpContent = {
    image: { ...defaultSignUpContent.image, ...signUpContent.image },
    quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
  };

  const currentContent = isSignIn ? finalSignInContent : finalSignUpContent;

  return (
    <div
      className={cn(
        "w-full min-h-[540px] md:grid md:grid-cols-2 bg-neutral-950 text-white",
        className
      )}
    >
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
      <div className="flex min-h-[500px] items-center justify-center p-6 md:min-h-0 md:p-8 lg:p-12 bg-neutral-950">
        <AuthFormContainer
          isSignIn={isSignIn}
          onToggle={toggleForm}
          onGoogleSignIn={onGoogleSignIn}
          onEmailSignIn={onEmailSignIn}
          onEmailSignUp={onEmailSignUp}
          pendingOtp={pendingOtp}
          onVerifyOtp={onVerifyOtp}
          onCheckFirebaseLink={onCheckFirebaseLink}
          onResendOtp={onResendOtp}
          onCancelOtp={onCancelOtp}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      </div>

      <div
        key={currentContent.image.src}
        className="hidden md:block relative bg-cover bg-center transition-all duration-500 ease-in-out min-h-[540px]"
        style={{ backgroundImage: `url(${currentContent.image.src})` }}
      >
        <div className="absolute inset-x-0 bottom-0 h-[140px] bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />

        <div className="relative z-10 flex h-full flex-col items-center justify-end p-6 pb-8">
          <blockquote className="space-y-2 text-center text-white">
            <p className="text-lg font-medium">
              “
              <Typewriter
                key={currentContent.quote.text}
                text={currentContent.quote.text}
                speed={60}
              />
              ”
            </p>
            <cite className="block text-sm font-light text-neutral-300 not-italic">
              — {currentContent.quote.author}
            </cite>
          </blockquote>
        </div>
      </div>
    </div>
  );
}

export default AuthUI;
