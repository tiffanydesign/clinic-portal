// In-memory (not persisted) flow state for the account activation wizard.
// Deliberately not sessionStorage-backed: an in-progress, unauthenticated
// registration shouldn't survive a hard refresh — that's also what makes the
// step guards below meaningful (jumping straight to a later URL with no
// state redirects back to the start).
import { useSyncExternalStore, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAppContext } from "../../context/AppContext";

type RegistrationState = {
  email: string;
  emailConfirmed: boolean;
  codeVerified: boolean;
  activated: boolean;
};

const initialState: RegistrationState = { email: "", emailConfirmed: false, codeVerified: false, activated: false };
let state: RegistrationState = initialState;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function confirmEmail(email: string) {
  state = { email, emailConfirmed: true, codeVerified: false, activated: false };
  emit();
}

export function confirmCode() {
  state = { ...state, codeVerified: true };
  emit();
}

export function activateAccount() {
  state = { ...state, activated: true };
  emit();
}

export function useRegistrationState(): RegistrationState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state
  );
}

// Guards a registration step: if `ready` is false, bounce back to the start
// of the flow rather than letting a direct/refreshed URL skip ahead.
export function useRequireRegistrationStep(ready: boolean) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!ready) navigate("/register", { replace: true });
  }, [ready, navigate]);
}

// An already-signed-in user has no reason to be in the activation flow.
export function useRedirectIfAuthenticated() {
  const { isAuthenticated } = useAppContext();
  const navigate = useNavigate();
  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);
}
