import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getProfileDisplayName } from "@/services/profile-service";

export interface UserInfo {
  userName: string;
  userEmail: string;
  userId: string | null;
}

export const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    userName: "",
    userEmail: "",
    userId: null,
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return;
      }

      const userId = session.user.id;
      const userEmail = session.user.email || "";

      try {
        const userName = await getProfileDisplayName(userId, "User");

        setUserInfo({
          userName,
          userEmail,
          userId,
        });
      } catch (error) {
        // If profile doesn't exist or error, just use email
        setUserInfo({
          userName: "User",
          userEmail,
          userId,
        });
      }
    };

    fetchUserInfo();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserInfo();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return userInfo;
};
