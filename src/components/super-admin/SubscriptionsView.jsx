"use client"

import React, { useState, useEffect } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { analyticsService } from "@/services/analytics.service"

export function SubscriptionsView() {
    const [planData, setPlanData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlanData = async () => {
            try {
                const plans = await analyticsService.getPlanUsage();
                setPlanData(plans);
            } catch (error) {
                console.error("Error fetching plan data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlanData();
    }, []);

    return (
        <div className="space-y-6">
             <div>
                <h2 className="text-3xl font-bold tracking-tight">Subscriptions</h2>
                <p className="text-muted-foreground">Manage and analyze subscription plans.</p>
            </div>
            
            <Card className="@container/card overflow-hidden rounded-[2rem] flex flex-col max-w-2xl">
                <CardHeader>
                    <CardTitle>Subscription Distribution</CardTitle>
                    <CardDescription>
                        User breakdown by plan type.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-6 w-full">
                        {loading ? <p>Loading...</p> : !planData ? <p>No data available</p> : (
                            <div className="grid grid-cols-1 gap-4">
                                {Object.entries(planData).map(([planName, details]) => {
                                    let bgClass = "bg-primary/10";
                                    let dotClass = "bg-primary";

                                    if (planName === 'BASICO') { bgClass = "bg-slate-300/20"; dotClass = "bg-slate-400"; }
                                    if (planName === 'GALACTICO') { bgClass = "bg-purple-500/10"; dotClass = "bg-purple-500"; }

                                    return (
                                        <div key={planName} className={`flex items-center justify-between p-3 rounded-xl ${bgClass}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${dotClass}`} />
                                                <span className="font-medium capitalization">{planName.toLowerCase()}</span>
                                            </div>
                                            <span className="font-bold">{details.percentage}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
