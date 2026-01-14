"use client"

import React, { useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AuthDialog() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [signinEmail, setSigninEmail] = useState("")
  const [signinPassword, setSigninPassword] = useState("")
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function onSignIn() {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signinEmail, password: signinPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage("Signed in successfully")
        // You may want to store tokens or update app state here
      } else {
        setMessage(data?.message || "Sign in failed")
      }
    } catch (err) {
      setMessage("Sign in failed")
    } finally {
      setLoading(false)
    }
  }

  async function onSignUp() {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage("Account created successfully. You can now sign in.")
        setMode("signin")
        setSignupName("")
        setSignupEmail("")
        setSignupPassword("")
      } else {
        setMessage(data?.message || "Sign up failed")
      }
    } catch (err) {
      setMessage("Sign up failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="default">Sign In</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "signin" ? "Sign in" : "Create account"}</DialogTitle>
        </DialogHeader>

        {message && (
          <p className="text-sm text-muted-foreground mb-2">{message}</p>
        )}

        {mode === "signin" ? (
          <form onSubmit={(e) => { e.preventDefault(); onSignIn(); }} className="grid gap-4">
            <div>
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="you@domain.com"
                value={signinEmail}
                onChange={(e) => setSigninEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="signin-password">Password</Label>
              <Input
                id="signin-password"
                type="password"
                placeholder="Your password"
                value={signinPassword}
                onChange={(e) => setSigninPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
              <Button variant="outline" asChild>
                <a href="/api/auth/google">Sign in with Google</a>
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Don't have an account? <button type="button" className="text-primary underline" onClick={() => setMode("signup")}>Sign up</button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); onSignUp(); }} className="grid gap-4">
            <div>
              <Label htmlFor="signup-name">Name</Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Full name"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="you@domain.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Create a password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</Button>
              <Button variant="outline" asChild>
                <a href="/api/auth/google">Sign up with Google</a>
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Already have an account? <button type="button" className="text-primary underline" onClick={() => setMode("signin")}>Sign in</button>
            </div>
          </form>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => { setMessage(null); setMode("signin"); setSigninEmail(""); setSigninPassword(""); setSignupName(""); setSignupEmail(""); setSignupPassword(""); }}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AuthDialog
