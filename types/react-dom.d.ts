declare module 'react-dom' {
  // Tipi minimi sufficienti per Next App Router + Server Actions
  export function useFormStatus(): { pending: boolean };

  export function useFormState<S, P>(
    action: (state: S, payload: P) => S | Promise<S>,
    initialState: S
  ): [S, (payload: P) => void];
}
