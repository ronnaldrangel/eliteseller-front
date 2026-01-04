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
import { Lock, AlertCircle } from "lucide-react"
import { verifySuperAdmin } from "@/app/super-admin/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function Gatekeeper({ onAuthorized }) {
    const [email, setEmail] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const result = await verifySuperAdmin(email);
            if (result.success) {
                onAuthorized();
            } else {
                setError("Email does not match the super admin records.");
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
                            <Lock className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Admin Verification</CardTitle>
                    <CardDescription>
                        Please enter the Super Admin email to proceed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="rounded-xl h-11"
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
                            {loading ? "Verifying..." : "Verify Access"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t p-6">
                    <p className="text-xs text-muted-foreground text-center">
                        This additional check is required for security purposes when environment variables are not automatically detected.
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
