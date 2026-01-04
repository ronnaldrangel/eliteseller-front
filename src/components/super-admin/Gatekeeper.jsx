"use client"

import React, { useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, AlertCircle, KeyRound } from "lucide-react"
import { verifySuperAdmin } from "@/app/super-admin/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function Gatekeeper({ onAuthorized }) {
    const [code, setCode] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const result = await verifySuperAdmin(code);
            if (result.success) {
                onAuthorized();
            } else {
                setError("Incorrect access code.");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-lg rounded-[2rem]">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <KeyRound className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
                    <CardDescription>
                        Enter the access code to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Access Code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="rounded-xl h-11 text-center tracking-widest"
                                required
                            />
                        </div>
                        {error && (
                            <Alert variant="destructive" className="rounded-xl bg-destructive/5 text-destructive border-transparent">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle className="ml-2 font-medium">Access Denied</AlertTitle>
                                <AlertDescription className="ml-6 text-xs">
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}
                        <Button type="submit" className="w-full rounded-xl h-11 font-medium" disabled={loading}>
                            {loading ? "Verifying..." : "Unlock Dashboard"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t p-6">
                    <p className="text-xs text-muted-foreground text-center">
                        Secure Gateway
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
