"use client"

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupaBaseUser } from "@supabase/supabase-js";
import {
    Sparkles,
    FileText,
    CalendarCheck,
    ClipboardList,
    Users,
    Search,
    ArrowRight,
    Building2,
    GraduationCap,
    ShieldCheck,
    TrendingUp,
} from "lucide-react"
import Link from "next/link";