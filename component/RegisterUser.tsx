// components/RegisterUser.tsx

"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function RegisterUser() {
  const { isSignedIn, user } = useUser();
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !user || registered) return;

    const register = async () => {
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            fullName: user.fullName,
          }),
        });

        if (res.ok) {
          setRegistered(true);
          console.log("✅ User registered");
        } else {
          console.warn("⚠️ Registration failed");
        }
      } catch (err) {
        console.error("Error registering user:", err);
      }
    };

    register();
  }, [isSignedIn, user, registered]);

  return null; // This is a background component
}
